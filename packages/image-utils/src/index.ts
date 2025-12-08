/**
 * @tyos/image-utils
 *
 * Reusable Sharp-based image processing utilities for the tyOS photo CDN.
 * Handles resizing, format conversion, and optimization.
 */

// Core processing functions
export {
  processImage,
  getImageMetadata,
  validateImage,
  prepareInput,
  type ProcessOptions,
} from './processors.ts';

// Variant generation
export {
  generateVariants,
  generateSingleVariant,
  type GeneratedVariant,
  type GenerateVariantsOptions,
} from './variants.ts';

// Configuration and types
export {
  FORMATS,
  SIZES,
  QUALITY_SETTINGS,
  getVariantConfigs,
  getVariantFilename,
  type ImageFormat,
  type SizeName,
  type VariantConfig,
} from './config.ts';
