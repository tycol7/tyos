/**
 * Album CRUD endpoints
 */

import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { albums, photos } from '../../../packages/db/src/index.ts';
import { db } from '../lib/db.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { NotFoundError, ValidationError } from '../middleware/error.ts';
import { deleteFromR2, getPhotoVariantKeys } from '../utils/r2-upload.ts';
import { createAlbumSchema, updateAlbumSchema } from '../utils/validation.ts';

const albumsRouter = new Hono();

albumsRouter.use('*', authMiddleware);

// GET /albums - List all albums
albumsRouter.get('/', async (c) => {
  const allAlbums = await db.select().from(albums).orderBy(desc(albums.createdAt));

  // Fetch photo count and hero photo for each album
  const albumsWithMeta = await Promise.all(
    allAlbums.map(async (album) => {
      // Get photo count
      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(photos)
        .where(eq(photos.albumId, album.id));

      // Get hero photo
      const [heroPhoto] = await db
        .select({ id: photos.id, filename: photos.filename })
        .from(photos)
        .where(and(eq(photos.albumId, album.id), eq(photos.isHero, true)))
        .limit(1);

      return {
        id: album.id,
        name: album.name,
        description: album.description,
        photoCount: count,
        heroPhoto: heroPhoto || null,
        createdAt: album.createdAt.getTime(),
        updatedAt: album.updatedAt.getTime(),
      };
    })
  );

  return c.json({ albums: albumsWithMeta });
});

// GET /albums/:id - Get single album with photos
albumsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [album] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);

  if (!album) {
    throw new NotFoundError('Album not found');
  }

  const albumPhotos = await db
    .select({
      id: photos.id,
      filename: photos.filename,
      isHero: photos.isHero,
      sortOrder: photos.sortOrder,
      createdAt: photos.createdAt,
    })
    .from(photos)
    .where(eq(photos.albumId, id))
    .orderBy(photos.sortOrder);

  return c.json({
    album: {
      id: album.id,
      name: album.name,
      description: album.description,
      createdAt: album.createdAt.getTime(),
      updatedAt: album.updatedAt.getTime(),
    },
    photos: albumPhotos.map((photo) => ({
      ...photo,
      createdAt: photo.createdAt.getTime(),
    })),
  });
});

// POST /albums - Create new album
albumsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createAlbumSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const albumId = randomUUID();

  const [album] = await db
    .insert(albums)
    .values({
      id: albumId,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .returning();

  return c.json(
    {
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        createdAt: album.createdAt.getTime(),
        updatedAt: album.updatedAt.getTime(),
      },
    },
    201
  );
});

// PUT /albums/:id - Update album metadata
albumsRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateAlbumSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const [existingAlbum] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);

  if (!existingAlbum) {
    throw new NotFoundError('Album not found');
  }

  const [updated] = await db
    .update(albums)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(albums.id, id))
    .returning();

  return c.json({
    album: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      createdAt: updated.createdAt.getTime(),
      updatedAt: updated.updatedAt.getTime(),
    },
  });
});

// DELETE /albums/:id - Delete album and all photos
albumsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const [album] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);

  if (!album) {
    throw new NotFoundError('Album not found');
  }

  // Get all photos in album
  const albumPhotos = await db.select().from(photos).where(eq(photos.albumId, id));

  // Delete all photo files from R2 (originals + variants)
  const deletePromises: Promise<void>[] = [];
  for (const photo of albumPhotos) {
    const keys = getPhotoVariantKeys(id, photo.filename);
    deletePromises.push(...keys.map((key) => deleteFromR2(key)));
  }

  // Execute all R2 deletes in parallel
  await Promise.allSettled(deletePromises);

  // Delete album from DB (cascade deletes photos via foreign key)
  await db.delete(albums).where(eq(albums.id, id));

  return c.json({ success: true });
});

export default albumsRouter;
