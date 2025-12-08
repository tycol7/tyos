/**
 * Bearer token authentication middleware
 */

import { bearerAuth } from 'hono/bearer-auth';
import { config } from '../config.ts';

export const authMiddleware = bearerAuth({
  token: config.auth.token,
  invalidTokenMessage: 'Unauthorized',
});
