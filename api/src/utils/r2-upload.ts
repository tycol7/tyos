/**
 * R2 upload and delete helpers
 */

import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { R2_BUCKET_NAME, r2Client } from '../lib/r2.ts';

/**
 * Upload buffer to R2
 */
export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Generate all variant keys for a photo (for deletion)
 */
export function getPhotoVariantKeys(albumId: string, filename: string): string[] {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  const widths = [800, 1920];
  const formats = ['avif', 'webp', 'jpeg'];

  const keys: string[] = [`albums/${albumId}/${filename}`]; // Original

  for (const width of widths) {
    for (const format of formats) {
      keys.push(`albums/${albumId}/${nameWithoutExt}_${width}w.${format}`);
    }
  }

  return keys; // Returns 7 keys: 1 original + 6 variants
}
