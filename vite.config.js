import { defineConfig } from 'vite';

export default defineConfig({
  // Match this exactly to your GitHub repository name
  base: '/job-tracker/',
  server: {
    host: true,
    port: 5173,
    open: false,
  },
});