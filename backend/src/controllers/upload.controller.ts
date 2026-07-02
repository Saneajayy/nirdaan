import { Request, Response } from 'express';
import sharp from 'sharp';
import { uploadImageToS3 } from '../lib/s3';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'fail', message: 'No file uploaded' });
      return;
    }

    // Process image with Sharp
    // 1. Strip EXIF metadata
    // 2. Convert to JPEG for consistent handling
    // 3. Resize to a reasonable max dimension (e.g. 2048x2048) to save Gemini tokens and S3 space
    const processedBuffer = await sharp(req.file.buffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to S3
    const imageUrl = await uploadImageToS3(processedBuffer, 'image/jpeg');

    res.status(200).json({
      status: 'success',
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process and upload image' });
  }
};
