import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite configuration for web (non-Electron) build
 * This builds a standalone web app that can be deployed to any static host
 */
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for static deployment
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist-web',
    sourcemap: true,
    // Optimize chunk splitting for web
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-editor': ['@wirescript/editor'],
          'vendor-dsl': ['@wirescript/dsl'],
          'vendor-renderer': ['@wirescript/renderer'],
        },
      },
    },
  },
  define: {
    // Define app mode
    'import.meta.env.VITE_APP_MODE': JSON.stringify('web'),
  },
});
