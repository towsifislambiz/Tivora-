import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        // Code-split large vendor chunks for better caching
        manualChunks: {
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        }
      }
    },
    // Suppress non-critical chunk size warnings
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging without exposing source code
    sourcemap: false,
  }
});
