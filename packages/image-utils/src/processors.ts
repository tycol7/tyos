import { readFileSync } from 'node:fs';
// @ts-ignore - heic-convert doesn't have TypeScript types
import convert from 'heic-convert';
import sharp from 'sharp';
import type { ImageFormat } from './config.ts';

export interface ProcessOptions {
  width?: number | null;
  format: ImageFormat;
  quality: number;
}

/**
 * Detect if a buffer is HEIC/HEIF format
 */
async function isHEIC(input: Buffer | string): Promise<boolean> {
  try {
    const buffer = typeof input === 'string' ? readFileSync(input) : input;
    // HEIC files have 'ftyp' at bytes 4-8 followed by HEIC/heic/mif1/msf1
    const header = buffer.toString('ascii', 4, 12);
    return header.includes('heic') || header.includes('mif1') || header.includes('msf1');
  } catch {
    return false;
  }
}

/**
 * Convert HEIC/HEIF to PNG buffer (lossless)
 */
async function convertHEICToPNG(input: Buffer | string): Promise<Buffer> {
  const buffer = typeof input === 'string' ? readFileSync(input) : input;

  const outputBuffer = await convert({
    buffer,
    format: 'PNG',
    quality: 1, // Lossless
  });

  return Buffer.from(outputBuffer);
}

/**
 * Prepare input for Sharp processing (auto-converts HEIC to PNG)
 * Exported for use in variants.ts to avoid repeated conversions
 */
export async function prepareInput(input: Buffer | string): Promise<Buffer | string> {
  if (await isHEIC(input)) {
    console.log('  Detected HEIC format, converting to PNG...');
    return await convertHEICToPNG(input);
  }
  return input;
}

/**
 * Process an image buffer with Sharp
 * @param input - Image buffer or file path (HEIC auto-converted)
 * @param options - Processing options (size, format, quality)
 * @returns Processed image buffer
 */
export async function processImage(
  input: Buffer | string,
  options: ProcessOptions
): Promise<Buffer> {
  // Auto-convert HEIC to PNG if needed
  const processableInput = await prepareInput(input);

  // Auto-rotate based on EXIF orientation (fixes portrait photos)
  // IMPORTANT: This must be done BEFORE creating the sharp pipeline
  let pipeline = sharp(processableInput, { failOnError: false }).rotate();

  // Resize if width specified
  if (options.width) {
    pipeline = pipeline.resize(options.width, null, {
      fit: 'inside',
      withoutEnlargement: true, // Don't upscale smaller images
    });
  }

  // Convert to target format with quality settings
  switch (options.format) {
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: options.quality, progressive: true });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Get image metadata (dimensions, format, etc.)
 * Handles HEIC transparently
 */
export async function getImageMetadata(input: Buffer | string) {
  const processableInput = await prepareInput(input);
  const metadata = await sharp(processableInput).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
  };
}

/**
 * Validate that input is a supported image format
 * Returns true for HEIC, JPEG, PNG, and other Sharp-supported formats
 */
export async function validateImage(input: Buffer | string): Promise<boolean> {
  try {
    // Check if it's HEIC first
    if (await isHEIC(input)) {
      return true;
    }
    // Otherwise validate with Sharp
    const metadata = await sharp(input).metadata();
    return !!metadata.format;
  } catch {
    return false;
  }
}
