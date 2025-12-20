/**
 * @tyos/db
 *
 * Shared database client for tyOS monorepo
 * Connects to Turso (LibSQL) database
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

/**
 * Create a database client
 *
 * Usage:
 *   const db = createDb({
 *     url: process.env.TURSO_DATABASE_URL,
 *     authToken: process.env.TURSO_AUTH_TOKEN
 *   });
 */
export function createDb(config: { url: string; authToken: string }) {
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });

  return drizzle(client, { schema });
}

// Re-export schema and types
export * from './schema.ts';
export { schema };

// Type utilities for inferring types from schema
export type Post = typeof schema.posts.$inferSelect;
export type NewPost = typeof schema.posts.$inferInsert;
export type UpdatePost = Partial<Pick<Post, 'title' | 'slug' | 'content' | 'pubDate'>>;

export type Page = typeof schema.pages.$inferSelect;
export type NewPage = typeof schema.pages.$inferInsert;
export type UpdatePage = Partial<Pick<Page, 'title' | 'slug' | 'content'>>;

export type Album = typeof schema.albums.$inferSelect;
export type NewAlbum = typeof schema.albums.$inferInsert;

export type Photo = typeof schema.photos.$inferSelect;
export type NewPhoto = typeof schema.photos.$inferInsert;

// API Response types (timestamps as numbers, not Date objects)
type DateToNumber<T> = {
  [K in keyof T]: T[K] extends Date ? number : T[K] extends Date | null ? number | null : T[K];
};

export type PostResponse = DateToNumber<Post>;
export type PageResponse = DateToNumber<Page>;
export type AlbumResponse = DateToNumber<Album>;
export type PhotoResponse = DateToNumber<Photo>;

// API update input types (timestamps as numbers)
export type UpdatePostInput = Partial<{
  title: string;
  slug: string;
  content: string;
  pubDate: number | null;
}>;

export type UpdatePageInput = Partial<{
  title: string;
  slug: string;
  content: string;
}>;
