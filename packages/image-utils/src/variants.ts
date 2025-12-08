import { type VariantConfig, getVariantConfigs, getVariantFilename } from './config.ts';
import { getImageMetadata, prepareInput, processImage } from './processors.ts';

export interface GeneratedVariant {
  filename: string;
  buffer: Buffer;
  width: number | null;
  format: string;
  size: number; // Bytes
}

export interface GenerateVariantsOptions {
  /**
   * Original filename (used for generating variant filenames)
   */
  originalFilename: string;

  /**
   * Filter to only generate specific variants
   * Useful for testing or incremental generation
   */
  filter?: (config: VariantConfig) => boolean;
}

/**
 * Generate all image variants from an original image
 * @param input - Image buffer or file path
 * @param options - Generation options
 * @returns Array of generated variants with filenames and buffers
 */
export async function generateVariants(
  input: Buffer | string,
  options: GenerateVariantsOptions
): Promise<GeneratedVariant[]> {
  const { originalFilename, filter } = options;

  // Get all variant configurations
  let configs = getVariantConfigs();

  // Apply filter if provided
  if (filter) {
    configs = configs.filter(filter);
  }

  // Prepare input once (converts HEIC to PNG if needed)
  // This avoids converting the same HEIC 6 times
  const preparedInput = await prepareInput(input);

  // Get original metadata for logging/validation
  const metadata = await getImageMetadata(preparedInput);
  console.log(
    `Processing ${originalFilename}: ${metadata.width}x${metadata.height} (${metadata.format})`
  );

  // Generate all variants in parallel
  const variants = await Promise.all(
    configs.map(async (config) => {
      const filename = getVariantFilename(originalFilename, config.width, config.format);

      const buffer = await processImage(preparedInput, {
        width: config.width,
        format: config.format,
        quality: config.quality,
      });

      console.log(`  Generated ${filename}: ${(buffer.length / 1024).toFixed(1)} KB`);

      return {
        filename,
        buffer,
        width: config.width,
        format: config.format,
        size: buffer.length,
      };
    })
  );

  return variants;
}

/**
 * Generate a single variant (useful for testing or specific use cases)
 */
export async function generateSingleVariant(
  input: Buffer | string,
  originalFilename: string,
  width: number | null,
  format: 'webp' | 'avif' | 'jpeg',
  quality: number
): Promise<GeneratedVariant> {
  const filename = getVariantFilename(originalFilename, width, format);

  const buffer = await processImage(input, {
    width,
    format,
    quality,
  });

  return {
    filename,
    buffer,
    width,
    format,
    size: buffer.length,
  };
}
