/**
 * Photo utility functions
 */

const R2_PUBLIC_URL = 'https://photos.tylerd.co';

/**
 * Generate URL for a photo variant
 */
export function getVariantUrl(
  albumId: string,
  filename: string,
  width: number,
  format: string
): string {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  return `${R2_PUBLIC_URL}/albums/${albumId}/${nameWithoutExt}_${width}w.${format}`;
}
