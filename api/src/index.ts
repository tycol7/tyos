/**
 * Photo & Album CRUD API Server
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.ts';
import { errorHandler } from './middleware/error.ts';

import albumsRouter from './routes/albums.ts';
import deployRouter from './routes/deploy.ts';
// Routes
import health from './routes/health.ts';
import photosRouter from './routes/photos.ts';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Routes
app.route('/health', health);
app.route('/albums', albumsRouter);
app.route('/photos', photosRouter);
app.route('/deploy', deployRouter);

// Error handling
app.onError(errorHandler);

// Start server
console.log(`🚀 API server starting on port ${config.port}...`);

export default {
  port: config.port,
  fetch: app.fetch,
};
