import { createDb, posts as postsTable } from '@tyos/db';
/**
 * Custom Astro loader to fetch posts from Turso database
 * Uses Astro's built-in markdown processor
 */
import type { Loader } from 'astro/loaders';
import { desc } from 'drizzle-orm';

export function postsLoader(): Loader {
  return {
    name: 'posts-loader',
    load: async ({ store, logger, generateDigest, renderMarkdown }) => {
      logger.info('Loading posts from database...');

      // Create database connection
      const db = createDb({
        url: import.meta.env.TURSO_DATABASE_URL || '',
        authToken: import.meta.env.TURSO_AUTH_TOKEN || '',
      });

      // Fetch all posts from database, sorted by newest first
      const posts = await db.select().from(postsTable).orderBy(desc(postsTable.pubDate));

      logger.info(`Loaded ${posts.length} posts from database`);

      // Clear existing data
      store.clear();

      // Add each post to the store
      for (const post of posts) {
        store.set({
          id: post.slug, // Use slug as the ID for URLs
          data: {
            title: post.title,
            pubDate: post.pubDate,
            slug: post.slug,
            dbId: post.id, // Keep the UUID for database queries
            renderedContent: await renderMarkdown(post.content), // Pre-rendered HTML
          },
          body: post.content, // Keep raw markdown for reference
          digest: generateDigest(post.content),
        });
      }
    },
  };
}
