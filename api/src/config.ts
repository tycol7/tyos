/**
 * Environment configuration and validation
 */

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  // Turso Database
  turso: {
    url: getEnv('TURSO_DATABASE_URL'),
    authToken: getEnv('TURSO_AUTH_TOKEN'),
  },

  // Cloudflare R2
  r2: {
    accountId: getEnv('R2_ACCOUNT_ID'),
    accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
    bucketName: getEnv('R2_BUCKET_NAME'),
    publicUrl: getEnv('R2_PUBLIC_URL'),
  },

  // API Auth
  auth: {
    token: getEnv('API_AUTH_TOKEN'),
  },

  // GitHub
  github: {
    token: getEnv('GITHUB_TOKEN'),
    repoOwner: getEnv('GITHUB_REPO_OWNER'),
    repoName: getEnv('GITHUB_REPO_NAME'),
  },

  // Server
  port: Number.parseInt(process.env.PORT || '3000', 10),
  allowedOrigins: getEnv('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim()),
};
