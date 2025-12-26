#!/usr/bin/env bun
/**
 * Backfill EXIF metadata for existing photos
 *
 * This script:
 * 1. Fetches all photos from the database
 * 2. Downloads each photo from R2
 * 3. Extracts EXIF data using exiftool
 * 4. Updates the database with the metadata
 *
 * Usage: bun run scripts/backfill-exif.ts
 */

import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { createDb, photos } from '../packages/db/src/index.ts';

// Helper to get required env var
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

// Turso Configuration
const TURSO_DATABASE_URL = getEnv('TURSO_DATABASE_URL');
const TURSO_AUTH_TOKEN = getEnv('TURSO_AUTH_TOKEN');

// R2 Configuration
const R2_ACCOUNT_ID = getEnv('R2_ACCOUNT_ID');
const R2_ACCESS_KEY_ID = getEnv('R2_ACCESS_KEY_ID');
const R2_SECRET_ACCESS_KEY = getEnv('R2_SECRET_ACCESS_KEY');
const R2_BUCKET_NAME = getEnv('R2_BUCKET_NAME');

// Create database client (standalone, doesn't import API config)
const db = createDb({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

interface ExifToolOutput {
  Model?: string;
  FocalLength?: string;
  FNumber?: number;
  ExposureTime?: string | number;
  ISO?: number;
}

/**
 * Download a file from R2 to a temporary location
 */
async function downloadFromR2(key: string, destPath: string): Promise<void> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`No body in response for ${key}`);
  }

  // response.Body is already a Node.js Readable stream
  const writeStream = createWriteStream(destPath);
  await finished((response.Body as Readable).pipe(writeStream));
}

/**
 * Extract EXIF data using exiftool CLI
 */
async function extractExifWithTool(filePath: string): Promise<ExifToolOutput> {
  const proc = Bun.spawn([
    'exiftool',
    '-Model',
    '-FocalLength',
    '-FNumber',
    '-ExposureTime',
    '-ISO',
    '-json',
    filePath,
  ]);

  const output = await new Response(proc.stdout).text();
  const json = JSON.parse(output);

  return json[0] || {};
}

/**
 * Format focal length as "24mm"
 */
function formatFocalLength(focalLength: string | undefined): string | null {
  if (!focalLength) return null;
  // Extract number from strings like "24.0 mm" or "24 mm"
  const match = focalLength.match(/(\d+\.?\d*)/);
  if (!match) return null;
  return `${Math.round(Number.parseFloat(match[1]))}mm`;
}

/**
 * Format f-number as "f/2.8"
 */
function formatFNumber(fNumber: number | undefined): string | null {
  if (!fNumber) return null;
  return `f/${fNumber.toFixed(1)}`;
}

/**
 * Format exposure time as "1/500s" or "2s"
 */
function formatExposureTime(exposureTime: string | number | undefined): string | null {
  if (!exposureTime) return null;

  // Convert to string if it's a number
  const exposureStr = typeof exposureTime === 'number' ? exposureTime.toString() : exposureTime;

  // exposureTime from exiftool is like "1/500" or "2" or a number like 0.002
  if (exposureStr.includes('/')) {
    return `${exposureStr}s`;
  }
  const seconds = Number.parseFloat(exposureStr);
  if (seconds < 1) {
    const denominator = Math.round(1 / seconds);
    return `1/${denominator}s`;
  }
  return `${seconds.toFixed(1)}s`;
}

/**
 * Main backfill function
 */
async function backfillExif() {
  console.log('Starting EXIF backfill...\n');

  // Fetch all photos from database
  const allPhotos = await db.select().from(photos);
  console.log(`Found ${allPhotos.length} photos to process\n`);

  // Create temp directory
  const tempDir = join(tmpdir(), 'exif-backfill');
  await mkdir(tempDir, { recursive: true });

  let processed = 0;
  let updated = 0;
  let failed = 0;

  for (const photo of allPhotos) {
    processed++;
    console.log(`[${processed}/${allPhotos.length}] Processing: ${photo.filename}`);

    try {
      // Download photo from R2
      const r2Key = `albums/${photo.albumId}/${photo.filename}`;
      const tempPath = join(tempDir, photo.filename);

      await downloadFromR2(r2Key, tempPath);

      // Extract EXIF
      const exif = await extractExifWithTool(tempPath);

      const camera = exif.Model || null;
      const lens = formatFocalLength(exif.FocalLength);
      const fStop = formatFNumber(exif.FNumber);
      const shutterSpeed = formatExposureTime(exif.ExposureTime);
      const iso = exif.ISO?.toString() || null;

      // Update database
      await db
        .update(photos)
        .set({
          camera,
          lens,
          fStop,
          shutterSpeed,
          iso,
        })
        .where(eq(photos.id, photo.id));

      console.log(
        `  ✓ Updated: ${camera || '(no camera)'} | ${lens || '-'} | ${fStop || '-'} | ${shutterSpeed || '-'} | ${iso ? `ISO ${iso}` : '-'}`
      );
      updated++;

      // Clean up temp file
      await rm(tempPath);
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  // Clean up temp directory
  await rm(tempDir, { recursive: true, force: true });

  console.log('\n✓ Backfill complete!');
  console.log(`  Processed: ${processed}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
}

// Run the backfill
backfillExif().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
