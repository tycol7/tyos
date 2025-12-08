/**
 * @tyos/db
 *
 * Shared database client for tyOS monorepo
 * Connects to Turso (LibSQL) database
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

/**
 * Create a database client
 *
 * Usage:
 *   const db = createDb({
 *     url: process.env.TURSO_DATABASE_URL,
 *     authToken: process.env.TURSO_AUTH_TOKEN
 *   });
 */
export function createDb(config: { url: string; authToken: string }) {
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });

  return drizzle(client, { schema });
}

// Re-export schema and types
export * from './schema.ts';
export { schema };
