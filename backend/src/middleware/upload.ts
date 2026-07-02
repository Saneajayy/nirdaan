import multer from 'multer';

// Use memory storage so we can process the buffer with Sharp before uploading
const storage = multer.memoryStorage();

// Max 10 MB per file as per requirements
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB
};

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only accept images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits,
  fileFilter,
});
