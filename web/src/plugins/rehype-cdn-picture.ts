import type { Element, Root } from 'hast';
/**
 * Custom rehype plugin to convert CDN image URLs to <picture> elements
 * Handles full URLs properly (unlike rehype-picture which uses path.normalize)
 */
import { visit } from 'unist-util-visit';

const CDN_BASE = 'https://photos.tylerd.co';

interface Options {
  /** Formats to generate sources for (in order of preference) */
  formats?: Array<'avif' | 'webp' | 'jpeg'>;
}

export default function rehypeCdnPicture(options: Options = {}) {
  const formats = options.formats || ['avif', 'webp', 'jpeg'];

  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      // Only process img tags
      if (!parent || typeof index !== 'number' || node.tagName !== 'img' || !node.properties?.src) {
        return;
      }

      const src = String(node.properties.src);

      // Only process our CDN URLs
      if (!src.startsWith(CDN_BASE)) {
        return;
      }

      // Extract the base URL without extension
      const lastDotIndex = src.lastIndexOf('.');
      if (lastDotIndex === -1) return;

      const baseUrl = src.substring(0, lastDotIndex);
      const currentExt = src.substring(lastDotIndex + 1);

      // Create source elements for each format (except the fallback)
      const sources: Element[] = [];
      for (const format of formats) {
        if (format === currentExt) continue; // Skip the original format

        sources.push({
          type: 'element',
          tagName: 'source',
          properties: {
            srcset: `${baseUrl}.${format}`,
            type: `image/${format}`,
          },
          children: [],
        });
      }

      // If no sources were generated, don't wrap in picture
      if (sources.length === 0) {
        return;
      }

      // Replace img with picture containing sources + img
      parent.children[index] = {
        type: 'element',
        tagName: 'picture',
        properties: {},
        children: [...sources, node],
      };
    });
  };
}
