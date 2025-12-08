/**
 * Image processing configuration
 */

export const FORMATS = ['webp', 'avif', 'jpeg'] as const;
export type ImageFormat = (typeof FORMATS)[number];

export const SIZES = {
  original: null, // Keep original size
  large: 1920, // Full-size web version
  thumbnail: 800, // Thumbnail/preview size
} as const;

export type SizeName = keyof typeof SIZES;

export interface VariantConfig {
  width: number | null;
  format: ImageFormat;
  quality: number;
}

/**
 * Quality settings per format (0-100)
 */
export const QUALITY_SETTINGS: Record<ImageFormat, number> = {
  webp: 80,
  avif: 75, // AVIF typically achieves better compression, can use lower quality
  jpeg: 85,
};

/**
 * Generate all size/format variant configurations
 */
export function getVariantConfigs(): VariantConfig[] {
  const variants: VariantConfig[] = [];

  for (const [sizeName, width] of Object.entries(SIZES)) {
    // Skip original size - we keep the uploaded original as-is
    if (sizeName === 'original') continue;

    for (const format of FORMATS) {
      variants.push({
        width,
        format,
        quality: QUALITY_SETTINGS[format],
      });
    }
  }

  return variants;
}

/**
 * Generate filename for a variant
 * Example: IMG_1234_1920w.webp
 */
export function getVariantFilename(
  originalName: string,
  width: number | null,
  format: ImageFormat
): string {
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '');
  const sizeLabel = width ? `_${width}w` : '';
  return `${nameWithoutExt}${sizeLabel}.${format}`;
}
