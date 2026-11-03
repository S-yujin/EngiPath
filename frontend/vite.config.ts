import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// No layout/design changes: only configure where the existing /api calls go.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        }
      }
    }
  };
});
