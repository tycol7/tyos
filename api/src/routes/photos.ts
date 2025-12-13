/**
 * Photo upload and management endpoints
 */

import { randomUUID } from 'node:crypto';
import { asc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { albums, photos } from '../../../packages/db/src/index.ts';
import { generateVariants } from '../../../packages/image-utils/src/index.ts';
import { db } from '../lib/db.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { NotFoundError, UploadError, ValidationError } from '../middleware/error.ts';
import { diffPhotoState } from '../utils/diff.ts';
import { deleteFromR2, uploadToR2 } from '../utils/r2-upload.ts';
import { bulkUpdatePhotosSchema, sanitizeFilename } from '../utils/validation.ts';

const photosRouter = new Hono();

photosRouter.use('*', authMiddleware);

// POST /albums/:id/photos - Upload new photo
photosRouter.post('/albums/:id/photos', async (c) => {
  const albumId = c.req.param('id');

  // Validate album exists
  const [album] = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);

  if (!album) {
    throw new NotFoundError('Album not found');
  }

  // Parse multipart form data
  const body = await c.req.parseBody();
  const file = body.file;
  const isHero = body.isHero === 'true';

  if (!file || typeof file === 'string') {
    throw new ValidationError('File is required');
  }

  // Validate file type and size
  // HEIC files can report as 'image/heic', 'image/heif', or even empty string
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

  const isValidType =
    allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension || '');

  if (!isValidType) {
    throw new ValidationError('Invalid file type. Allowed: JPEG, PNG, HEIC');
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new ValidationError('File too large (max 50MB)');
  }

  const photoId = randomUUID();
  const sanitized = sanitizeFilename(file.name);

  const uploadedKeys: string[] = [];

  try {
    // Read file buffer
    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Upload original to R2
    const originalKey = `albums/${albumId}/${sanitized}`;
    await uploadToR2(originalKey, imageBuffer, file.type);
    uploadedKeys.push(originalKey);

    // Generate variants synchronously
    const variants = await generateVariants(imageBuffer, {
      originalFilename: sanitized,
    });

    // Upload all variants to R2
    for (const variant of variants) {
      const variantKey = `albums/${albumId}/${variant.filename}`;
      await uploadToR2(variantKey, variant.buffer, `image/${variant.format}`);
      uploadedKeys.push(variantKey);
    }

    // Determine sortOrder (max + 1)
    const [maxResult] = await db
      .select({ max: sql<number>`MAX(${photos.sortOrder})` })
      .from(photos)
      .where(eq(photos.albumId, albumId));
    const sortOrder = (maxResult?.max ?? -1) + 1;

    // Handle hero flag
    if (isHero) {
      // Unset existing hero
      await db.update(photos).set({ isHero: false }).where(eq(photos.albumId, albumId));
    }

    // Insert photo into DB
    const [photo] = await db
      .insert(photos)
      .values({
        id: photoId,
        albumId,
        filename: sanitized,
        isHero,
        sortOrder,
      })
      .returning();

    return c.json(
      {
        photo: {
          id: photo.id,
          albumId: photo.albumId,
          filename: photo.filename,
          isHero: photo.isHero,
          sortOrder: photo.sortOrder,
        },
      },
      201
    );
  } catch (error) {
    // Rollback: delete all uploaded files from R2
    console.error('Upload failed, rolling back R2 uploads:', error);
    await Promise.allSettled(uploadedKeys.map((key) => deleteFromR2(key)));

    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    throw new UploadError(
      `Photo upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// PUT /albums/:id/photos - Bulk update photos (reorder, change hero)
photosRouter.put('/albums/:id/photos', async (c) => {
  const albumId = c.req.param('id');

  // Validate album exists
  const [album] = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);

  if (!album) {
    throw new NotFoundError('Album not found');
  }

  const body = await c.req.json();
  const parsed = bulkUpdatePhotosSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  // Fetch existing photos
  const existingPhotos = await db.select().from(photos).where(eq(photos.albumId, albumId));

  // Validate all IDs belong to this album
  const existingIds = new Set(existingPhotos.map((p) => p.id));
  for (const update of parsed.data.photos) {
    if (!existingIds.has(update.id)) {
      throw new ValidationError(`Photo ${update.id} not found in album`);
    }
  }

  // Validate exactly one hero
  const heroCount = parsed.data.photos.filter((p) => p.isHero).length;
  if (heroCount !== 1) {
    throw new ValidationError(`Exactly one photo must be hero (found ${heroCount})`);
  }

  // Diff and collect updates
  const { updates } = diffPhotoState(existingPhotos, parsed.data.photos);

  // Execute batch update
  for (const update of updates) {
    await db
      .update(photos)
      .set({
        sortOrder: update.sortOrder,
        isHero: update.isHero,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(photos.id, update.id));
  }

  return c.json({ updated: updates.length });
});

// DELETE /photos/:id - Delete photo from database only
// Note: Does NOT delete from R2 since Astro static site may still reference it
photosRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);

  if (!photo) {
    throw new NotFoundError('Photo not found');
  }

  // Delete photo from DB only (preserve R2 files for Astro site)
  await db.delete(photos).where(eq(photos.id, id));

  // If deleted photo was hero, make first remaining photo the new hero
  if (photo.isHero) {
    const [firstPhoto] = await db
      .select()
      .from(photos)
      .where(eq(photos.albumId, photo.albumId))
      .orderBy(asc(photos.sortOrder))
      .limit(1);

    if (firstPhoto) {
      await db.update(photos).set({ isHero: true }).where(eq(photos.id, firstPhoto.id));
    }
  }

  return c.json({ success: true });
});

export default photosRouter;
