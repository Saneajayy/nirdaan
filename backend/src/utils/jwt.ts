import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET || 'secret', {
    expiresIn: '15m',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as TokenPayload;
};
