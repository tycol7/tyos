/**
 * EXIF metadata extraction utilities
 */

import exifReader from 'exif-reader';

export interface ExifData {
  camera: string | null;
  lens: string | null;
  fStop: string | null;
  shutterSpeed: string | null;
  iso: string | null;
}

/**
 * Format f-number as "f/2.8" string
 */
function formatFNumber(fNumber: number | undefined): string | null {
  if (!fNumber) return null;
  return `f/${fNumber.toFixed(1)}`;
}

/**
 * Format exposure time as "1/500s" or "2s" string
 */
function formatExposureTime(exposureTime: number | undefined): string | null {
  if (!exposureTime) return null;

  if (exposureTime < 1) {
    // Fast shutter speed - show as fraction
    const denominator = Math.round(1 / exposureTime);
    return `1/${denominator}s`;
  }
  // Slow shutter speed - show as decimal
  return `${exposureTime.toFixed(1)}s`;
}

/**
 * Format focal length as "24mm" or "24-70mm" string
 */
function formatFocalLength(focalLength: number | undefined): string | null {
  if (!focalLength) return null;
  return `${Math.round(focalLength)}mm`;
}

/**
 * Extract EXIF data from Sharp metadata buffer
 * @param exifBuffer - Raw EXIF buffer from Sharp's metadata.exif
 * @returns Formatted EXIF data for database storage
 */
export function extractExifData(exifBuffer: Buffer): ExifData {
  try {
    const exif = exifReader(exifBuffer);

    return {
      camera: exif.Image?.Model || null,
      lens: formatFocalLength(exif.Photo?.FocalLength),
      fStop: formatFNumber(exif.Photo?.FNumber),
      shutterSpeed: formatExposureTime(exif.Photo?.ExposureTime),
      iso: exif.Photo?.ISOSpeedRatings?.toString() || null,
    };
  } catch (error) {
    console.error('Failed to parse EXIF data:', error);
    return {
      camera: null,
      lens: null,
      fStop: null,
      shutterSpeed: null,
      iso: null,
    };
  }
}
