import { createDb, pages as pagesTable } from '@tyos/db';
/**
 * Custom Astro loader to fetch pages from Turso database
 * Uses Astro's built-in markdown processor
 */
import type { Loader } from 'astro/loaders';

export function pagesLoader(): Loader {
  return {
    name: 'pages-loader',
    load: async ({ store, logger, generateDigest, renderMarkdown }) => {
      logger.info('Loading pages from database...');

      // Create database connection
      const db = createDb({
        url: import.meta.env.TURSO_DATABASE_URL || '',
        authToken: import.meta.env.TURSO_AUTH_TOKEN || '',
      });

      // Fetch all pages from database
      const pages = await db.select().from(pagesTable);

      logger.info(`Loaded ${pages.length} pages from database`);

      // Clear existing data
      store.clear();

      // Add each page to the store
      for (const page of pages) {
        store.set({
          id: page.slug, // Use slug as the ID for URLs
          data: {
            title: page.title,
            slug: page.slug,
            dbId: page.id, // Keep the UUID for database queries
            renderedContent: await renderMarkdown(page.content), // Pre-rendered HTML
          },
          body: page.content, // Keep raw markdown for reference
          digest: generateDigest(page.content),
        });
      }
    },
  };
}
