import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// Read version from package.json at build time
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    // Inject app version into the bundle so the update checker can read it
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  }
});
