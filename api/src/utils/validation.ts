/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

// Album validation schemas
export const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
});

// Photo validation schemas
export const bulkUpdatePhotosSchema = z.object({
  photos: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().nonnegative(),
      isHero: z.boolean(),
    })
  ),
});

// Page validation schemas
export const createPageSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string(),
});

export const updatePageSchema = z.object({
  slug: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
});

// Post validation schemas
export const createPostSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string(),
  pubDate: z.number().int().nullable().optional(),
});

export const updatePostSchema = z.object({
  slug: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  pubDate: z.number().int().nullable().optional(),
});

// Filename sanitization
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\.\//g, '');

  // Remove special characters except for ., -, and _
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  return sanitized;
}
