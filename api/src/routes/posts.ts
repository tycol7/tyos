/**
 * Post CRUD endpoints
 */

import { randomUUID } from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { posts } from '../../../packages/db/src/index.ts';
import { db } from '../lib/db.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { NotFoundError, ValidationError } from '../middleware/error.ts';
import { createPostSchema, updatePostSchema } from '../utils/validation.ts';

const postsRouter = new Hono();

postsRouter.use('*', authMiddleware);

// GET /posts - List all posts
postsRouter.get('/', async (c) => {
  // Sort by pubDate (newest first), with unpublished posts (null pubDate) at the end
  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(sql`${posts.pubDate} IS NULL, ${posts.pubDate} DESC`);

  return c.json({
    posts: allPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      pubDate: post.pubDate ? post.pubDate.getTime() : null,
      createdAt: post.createdAt.getTime(),
      updatedAt: post.updatedAt.getTime(),
    })),
  });
});

// GET /posts/:id - Get single post
postsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  return c.json({
    post: {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      pubDate: post.pubDate ? post.pubDate.getTime() : null,
      createdAt: post.createdAt.getTime(),
      updatedAt: post.updatedAt.getTime(),
    },
  });
});

// POST /posts - Create new post
postsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const postId = randomUUID();

  const [post] = await db
    .insert(posts)
    .values({
      id: postId,
      slug: parsed.data.slug,
      title: parsed.data.title,
      content: parsed.data.content,
      pubDate: parsed.data.pubDate ? new Date(parsed.data.pubDate) : null,
    })
    .returning();

  return c.json(
    {
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        pubDate: post.pubDate ? post.pubDate.getTime() : null,
        createdAt: post.createdAt.getTime(),
        updatedAt: post.updatedAt.getTime(),
      },
    },
    201
  );
});

// PUT /posts/:id - Update post
postsRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updatePostSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const [existingPost] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  if (!existingPost) {
    throw new NotFoundError('Post not found');
  }

  let pubDate = existingPost.pubDate;
  if (parsed.data.pubDate !== undefined) {
    pubDate = parsed.data.pubDate ? new Date(parsed.data.pubDate) : null;
  }

  const [updated] = await db
    .update(posts)
    .set({
      slug: parsed.data.slug ?? existingPost.slug,
      title: parsed.data.title ?? existingPost.title,
      content: parsed.data.content ?? existingPost.content,
      pubDate,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(posts.id, id))
    .returning();

  return c.json({
    post: {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      content: updated.content,
      pubDate: updated.pubDate ? updated.pubDate.getTime() : null,
      createdAt: updated.createdAt.getTime(),
      updatedAt: updated.updatedAt.getTime(),
    },
  });
});

// DELETE /posts/:id - Delete post
postsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  await db.delete(posts).where(eq(posts.id, id));

  return c.json({ success: true });
});

export default postsRouter;
