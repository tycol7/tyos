// @ts-check
import { defineConfig } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeCdnPicture from './src/plugins/rehype-cdn-picture.ts';

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@tyos/db': new URL('../packages/db/src/index.ts', import.meta.url).pathname,
      },
    },
    ssr: {
      noExternal: ['pico'],
    },
  },

  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { rel: ['noreferrer'] }],
      [
        rehypeCdnPicture,
        {
          formats: ['avif', 'webp', 'jpeg'],
        },
      ],
    ],
  },
});
