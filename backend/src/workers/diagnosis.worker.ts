import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma';
import { getImageFromS3 } from '../lib/s3';
import { analyzeCircuit } from '../lib/gemini';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const diagnosisQueue = new Queue('diagnosisQueue', { connection });

export const startDiagnosisWorker = () => {
  const worker = new Worker(
    'diagnosisQueue',
    async (job: Job) => {
      const { diagnosisId } = job.data;
      
      const diagnosis = await prisma.diagnosis.findUnique({ where: { id: diagnosisId } });
      if (!diagnosis) throw new Error(`Diagnosis ${diagnosisId} not found`);

      try {
        // 1. Fetch image from S3
        const imageBuffer = await getImageFromS3(diagnosis.image_url);
        const base64Image = imageBuffer.toString('base64');

        // 2. Call Gemini
        const aiResponse = await analyzeCircuit(
          base64Image,
          'image/jpeg',
          diagnosis.description,
          diagnosis.language
        );

        // 3. Save result
        await prisma.diagnosis.update({
          where: { id: diagnosisId },
          data: {
            ai_response: aiResponse,
            status: 'complete',
          },
        });
      } catch (error) {
        console.error(`Failed to process diagnosis ${diagnosisId}:`, error);
        await prisma.diagnosis.update({
          where: { id: diagnosisId },
          data: { status: 'failed' },
        });
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
  });

  return worker;
};
