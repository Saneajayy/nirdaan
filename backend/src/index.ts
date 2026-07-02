import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import { globalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/diagnosis', diagnosisRoutes);

// Basic health check route
app.get('/health', async (req, res) => {
  try {
    // Quick DB check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

import { ensureBucketExists } from './lib/s3';
import { startDiagnosisWorker } from './workers/diagnosis.worker';

app.listen(port, async () => {
  await ensureBucketExists();
  startDiagnosisWorker();
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
