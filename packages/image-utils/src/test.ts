/**
 * Simple test script to verify image-utils package works
 * Run with: bun run src/test.ts
 */

import { readFileSync } from 'node:fs';
import { generateSingleVariant, generateVariants } from './index.ts';

async function test() {
  console.log('Testing @tyos/image-utils package...\n');

  // Test with one of the northern-california images
  const testImagePath = '../../web/src/assets/albums/northern-california/IMG_0036.jpeg';

  try {
    const imageBuffer = readFileSync(testImagePath);
    console.log(`Loaded test image: ${testImagePath}`);
    console.log(`Original size: ${(imageBuffer.length / 1024).toFixed(1)} KB\n`);

    // Test 1: Generate a single WebP variant
    console.log('Test 1: Generate single WebP variant (1920w)');
    const singleVariant = await generateSingleVariant(
      imageBuffer,
      'IMG_0036.jpeg',
      1920,
      'webp',
      80
    );
    console.log(`  Result: ${singleVariant.filename}`);
    console.log(`  Size: ${(singleVariant.size / 1024).toFixed(1)} KB\n`);

    // Test 2: Generate all variants
    console.log('Test 2: Generate all variants');
    const allVariants = await generateVariants(imageBuffer, {
      originalFilename: 'IMG_0036.jpeg',
    });

    console.log(`\nGenerated ${allVariants.length} variants:`);
    for (const variant of allVariants) {
      console.log(`  - ${variant.filename}: ${(variant.size / 1024).toFixed(1)} KB`);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
