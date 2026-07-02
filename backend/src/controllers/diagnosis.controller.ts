import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { diagnosisQueue } from '../workers/diagnosis.worker';

export const createDiagnosis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl, description, language } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    // Create record in DB
    const diagnosis = await prisma.diagnosis.create({
      data: {
        user_id: userId,
        image_url: imageUrl,
        description,
        language: language || 'en',
        status: 'pending',
      },
    });

    // Enqueue job for background processing
    await diagnosisQueue.add('processDiagnosis', { diagnosisId: diagnosis.id });

    res.status(202).json({
      status: 'success',
      data: {
        diagnosis,
      },
    });
  } catch (error) {
    console.error('Create diagnosis error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create diagnosis' });
  }
};

export const listDiagnoses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const diagnoses = await prisma.diagnosis.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        diagnoses,
      },
    });
  } catch (error) {
    console.error('List diagnoses error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch diagnoses' });
  }
};

export const getDiagnosisStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id },
    });

    if (!diagnosis) {
      res.status(404).json({ status: 'fail', message: 'Diagnosis not found' });
      return;
    }

    if (diagnosis.user_id !== userId) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        diagnosis,
      },
    });
  } catch (error) {
    console.error('Get diagnosis status error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch diagnosis status' });
  }
};
