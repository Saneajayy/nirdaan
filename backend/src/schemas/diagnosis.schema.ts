import { z } from 'zod';

export const createDiagnosisSchema = z.object({
  body: z.object({
    imageUrl: z.string().url('Invalid image URL'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    language: z.enum(['en', 'hi']).default('en'),
  }),
});
