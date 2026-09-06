/// <reference types="vitest/config" />
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repository-name>/. The workflow sets
// GITHUB_REPOSITORY to "owner/name"; locally we fall back to "/".
const repository = process.env.GITHUB_REPOSITORY;
const base = repository ? `/${repository.split('/')[1]}/` : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
