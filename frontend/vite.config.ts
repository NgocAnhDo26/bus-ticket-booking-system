// Force restart
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Best practice: this should be the server origin (no trailing `/api`),
  // since OpenAPI/Orval-generated clients typically include the `/api/...` prefix in paths.
  const apiBaseUrl = env.VITE_API_URL ?? 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      hmr: {
        host: 'localhost',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Fix for SockJS "global is not defined"
    define: {
      global: 'window',
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    },
  };
});
