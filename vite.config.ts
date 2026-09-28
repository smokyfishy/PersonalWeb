import { defineConfig } from 'vitest/config';

export default defineConfig({
  // SPA: vite dev/preview fall back to index.html for /about, /projects, etc.
  appType: 'spa',
  // GitHub Pages serves the site from /PersonalWeb/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
