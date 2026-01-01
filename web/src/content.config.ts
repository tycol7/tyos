import { defineCollection, z } from 'astro:content';

import { pagesLoader } from './loaders/pages-loader.ts';
import { postsLoader } from './loaders/posts-loader.ts';

const posts = defineCollection({
  loader: postsLoader(),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date().nullable(),
    updatedAt: z.coerce.date(),
    slug: z.string(),
    dbId: z.string(), // Database UUID
    renderedContent: z.object({
      html: z.string(), // Pre-rendered HTML
    }),
  }),
});

const pages = defineCollection({
  loader: pagesLoader(),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    dbId: z.string(), // Database UUID
    renderedContent: z.object({
      html: z.string(), // Pre-rendered HTML
    }),
  }),
});

export const collections = { posts, pages };
