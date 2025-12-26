/**
 * Database schema for tyOS content
 *
 * Manages photo albums and metadata
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(), // Slug (e.g., 'hawaii')
  name: text('name').notNull(), // Display name (e.g., 'Hawaii')
  description: text('description'), // Optional album description
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey(), // UUID
    albumId: text('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(), // Original filename
    isHero: integer('is_hero', { mode: 'boolean' }).notNull().default(false), // Is this the hero/thumbnail for the album?
    sortOrder: integer('sort_order').notNull().default(0), // Manual sort order
    // EXIF metadata
    camera: text('camera'), // Camera model (e.g., "Fujifilm X100F")
    lens: text('lens'), // Lens focal length (e.g., "24mm", "RF 24-70mm F2.8")
    fStop: text('f_stop'), // Aperture (e.g., "f/2.8")
    shutterSpeed: text('shutter_speed'), // Exposure time (e.g., "1/500s")
    iso: text('iso'), // ISO sensitivity (e.g., "200")
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    albumIdIdx: index('idx_photos_album_id').on(table.albumId),
    uniqueFilename: unique().on(table.albumId, table.filename),
  })
);

export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey(), // UUID
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(), // Markdown
    pubDate: integer('pub_date', { mode: 'timestamp' }), // NULL = draft
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    slugIdx: index('idx_posts_slug').on(table.slug),
    pubDateIdx: index('idx_posts_pub_date').on(table.pubDate),
  })
);

export const pages = sqliteTable(
  'pages',
  {
    id: text('id').primaryKey(), // UUID
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(), // Markdown
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    slugIdx: index('idx_pages_slug').on(table.slug),
  })
);

export const media = sqliteTable(
  'media',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(), // 'post' or 'page'
    referenceId: text('reference_id').notNull(), // post_id or page_id
    filename: text('filename').notNull(),
    alt: text('alt').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => ({
    referenceIdIdx: index('idx_media_reference_id').on(table.referenceId),
    uniqueFilename: unique().on(table.referenceId, table.filename),
  })
);
