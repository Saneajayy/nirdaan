import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword } from '../utils/hash';
import { generateAccessToken } from '../utils/jwt';

// Helper to generate and store a refresh token
const generateAndStoreRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  return token;
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, preferred_language } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ status: 'fail', message: 'User already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name,
        preferred_language,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateAndStoreRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
      return;
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateAndStoreRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      res.status(401).json({ status: 'fail', message: 'No refresh token provided' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!storedToken || storedToken.revoked || storedToken.expires_at < new Date()) {
      res.status(401).json({ status: 'fail', message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: storedToken.user_id } });
    if (!user) {
      res.status(401).json({ status: 'fail', message: 'User not found' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    res.status(200).json({ status: 'success', data: { accessToken } });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.update({
        where: { token_hash: tokenHash },
        data: { revoked: true },
      }).catch(() => {}); // ignore if already revoked or not found
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
