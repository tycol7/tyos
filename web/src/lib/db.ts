/**
 * Database client for Astro
 *
 * Creates a singleton Turso client for use in Astro pages
 */

import { createDb } from '@tyos/db';

// Create database client
// In Astro, this runs at build time, not runtime
export const db = createDb({
  url: import.meta.env.TURSO_DATABASE_URL || '',
  authToken: import.meta.env.TURSO_AUTH_TOKEN || '',
});
