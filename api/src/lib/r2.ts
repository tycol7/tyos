/**
 * Cloudflare R2 client (S3-compatible)
 */

import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.ts';

const R2_ENDPOINT = `https://${config.r2.accountId}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export const R2_BUCKET_NAME = config.r2.bucketName;
export const R2_PUBLIC_URL = config.r2.publicUrl;
