/**
 * Database client for API
 */

import { createDb } from '../../../packages/db/src/index.ts';
import { config } from '../config.ts';

export const db = createDb({
  url: config.turso.url,
  authToken: config.turso.authToken,
});
