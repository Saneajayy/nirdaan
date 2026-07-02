import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.routes';
import prisma from '../lib/prisma';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };
  
  let accessToken: string;
  let cookies: string[];

  beforeAll(async () => {
    // Clean up test DB
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should sign up a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);
      
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    
    // Save tokens for next tests
    accessToken = res.body.data.accessToken;
    cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });

  it('should not allow duplicate email signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);
      
    expect(res.status).toBe(409);
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
      
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.accessToken).toBeDefined();
    cookies = res.headers['set-cookie'];
  });

  it('should refresh the access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
      
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should logout the user and revoke token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookies);
      
    expect(res.status).toBe(200);
    
    // Attempting to refresh again should fail
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
      
    expect(refreshRes.status).toBe(401);
  });
});
