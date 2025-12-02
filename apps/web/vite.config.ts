import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and React DOM
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react/') || id.includes('react\\')) {
              return 'react';
            }
            
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            
            // i18next
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            
            // UI libraries
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            
            // Other vendor code
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@tanstack/react-query'],
  },
});

