import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true, // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'nirdaan-images';

// Helper to ensure bucket exists (useful for local MinIO dev)
export const ensureBucketExists = async () => {
  try {
    const { HeadBucketCommand, CreateBucketCommand } = await import('@aws-sdk/client-s3');
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Bucket ${BUCKET_NAME} created successfully`);
      }
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
  }
};

export const uploadImageToS3 = async (buffer: Buffer, mimetype: string): Promise<string> => {
  const fileName = `${uuidv4()}.jpg`; // We convert to JPEG via Sharp before uploading

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: 'image/jpeg',
  });

  await s3Client.send(command);

  // Return the public URL
  // If using MinIO locally without public bucket config, you might need a presigned URL or to configure MinIO bucket as public.
  // For this flow, we'll return a direct URL format.
  const endpointUrl = process.env.S3_ENDPOINT || 'http://localhost:9000';
  return `${endpointUrl}/${BUCKET_NAME}/${fileName}`;
};

export const getImageFromS3 = async (imageUrl: string): Promise<Buffer> => {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  // Parse the key from the URL (e.g. http://localhost:9000/nirdaan-images/filename.jpg)
  const urlParts = imageUrl.split('/');
  const key = urlParts[urlParts.length - 1];

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const byteArray = await response.Body?.transformToByteArray();
  if (!byteArray) throw new Error('Could not download image from S3');
  return Buffer.from(byteArray);
};

export default s3Client;
