/**
 * Netlify build trigger endpoint
 */

import { Hono } from 'hono';
import { triggerBuild } from '../lib/netlify.ts';
import { authMiddleware } from '../middleware/auth.ts';

const publish = new Hono();

publish.use('*', authMiddleware);

publish.post('/', async (c) => {
  try {
    await triggerBuild();
    return c.json({
      triggered: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    throw new Error(
      `Failed to trigger build: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export default publish;
