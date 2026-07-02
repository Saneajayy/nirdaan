import { Router } from 'express';
import { createDiagnosis, listDiagnoses, getDiagnosisStatus } from '../controllers/diagnosis.controller';
import { validate } from '../middleware/validate';
import { createDiagnosisSchema } from '../schemas/diagnosis.schema';
import { requireAuth } from '../middleware/auth';
import { aiDiagnosisLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply auth middleware to all diagnosis routes
router.use(requireAuth);

// Create a diagnosis (apply strict AI rate limiter here to prevent cost abuse)
router.post('/', aiDiagnosisLimiter, validate(createDiagnosisSchema), createDiagnosis);

// Get list of past diagnoses
router.get('/', listDiagnoses);

// Get specific diagnosis (for polling status/results)
router.get('/:id', getDiagnosisStatus);

export default router;
