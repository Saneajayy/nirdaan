import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import { uploadMiddleware } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Endpoint expects a multipart form-data request with a field named "image"
router.post('/', requireAuth, uploadMiddleware.single('image'), uploadImage);

export default router;
