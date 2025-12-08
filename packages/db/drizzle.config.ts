import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'libsql://tyos-content-tylerdb.aws-us-west-2.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  },
});
