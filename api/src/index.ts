/**
 * Photo & Album CRUD API Server
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.ts';
import { errorHandler } from './middleware/error.ts';

import albumsRouter from './routes/albums.ts';
// Routes
import health from './routes/health.ts';
import photosRouter from './routes/photos.ts';
import publish from './routes/publish.ts';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/health', health);
app.route('/albums', albumsRouter);
app.route('/photos', photosRouter);
app.route('/publish', publish);

// Error handling
app.onError(errorHandler);

// Start server
console.log(`🚀 API server starting on port ${config.port}...`);

export default {
  port: config.port,
  fetch: app.fetch,
};
