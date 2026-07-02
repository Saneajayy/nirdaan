import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../lib/redis';

// Global API rate limiter (e.g., 100 requests per 15 minutes)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis and ioredis
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Stricter rate limiter for expensive AI diagnosis endpoints (e.g., 5 per hour)
export const aiDiagnosisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis and ioredis
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  message: {
    status: 'fail',
    message: 'Diagnosis quota exceeded. Please try again later.',
  },
});
