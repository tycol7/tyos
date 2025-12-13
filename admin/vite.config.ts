import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tyos/db': path.resolve(__dirname, '../packages/db/src/index.ts'),
      '@tyos/image-utils': path.resolve(__dirname, '../packages/image-utils/src/index.ts'),
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
