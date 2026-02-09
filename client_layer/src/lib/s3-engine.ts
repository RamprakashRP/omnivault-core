// client_layer/src/lib/s3-engine.ts
import { S3Client } from "@aws-sdk/client-s3";

// Create a single instance of the S3 Client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});