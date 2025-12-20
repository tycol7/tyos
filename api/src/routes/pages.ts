/**
 * Page CRUD endpoints
 */

import { randomUUID } from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { pages } from '../../../packages/db/src/index.ts';
import { db } from '../lib/db.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { NotFoundError, ValidationError } from '../middleware/error.ts';
import { createPageSchema, updatePageSchema } from '../utils/validation.ts';

const pagesRouter = new Hono();

pagesRouter.use('*', authMiddleware);

// GET /pages - List all pages
pagesRouter.get('/', async (c) => {
  const allPages = await db.select().from(pages).orderBy(desc(pages.updatedAt));

  return c.json({
    pages: allPages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      createdAt: page.createdAt.getTime(),
      updatedAt: page.updatedAt.getTime(),
    })),
  });
});

// GET /pages/:id - Get single page
pagesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);

  if (!page) {
    throw new NotFoundError('Page not found');
  }

  return c.json({
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      createdAt: page.createdAt.getTime(),
      updatedAt: page.updatedAt.getTime(),
    },
  });
});

// POST /pages - Create new page
pagesRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createPageSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const pageId = randomUUID();

  const [page] = await db
    .insert(pages)
    .values({
      id: pageId,
      slug: parsed.data.slug,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .returning();

  return c.json(
    {
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        content: page.content,
        createdAt: page.createdAt.getTime(),
        updatedAt: page.updatedAt.getTime(),
      },
    },
    201
  );
});

// PUT /pages/:id - Update page
pagesRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updatePageSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const [existingPage] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);

  if (!existingPage) {
    throw new NotFoundError('Page not found');
  }

  const [updated] = await db
    .update(pages)
    .set({
      slug: parsed.data.slug ?? existingPage.slug,
      title: parsed.data.title ?? existingPage.title,
      content: parsed.data.content ?? existingPage.content,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(pages.id, id))
    .returning();

  return c.json({
    page: {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      content: updated.content,
      createdAt: updated.createdAt.getTime(),
      updatedAt: updated.updatedAt.getTime(),
    },
  });
});

// DELETE /pages/:id - Delete page
pagesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);

  if (!page) {
    throw new NotFoundError('Page not found');
  }

  await db.delete(pages).where(eq(pages.id, id));

  return c.json({ success: true });
});

export default pagesRouter;
