
import path from 'path';
// FIX: Import fileURLToPath to define __dirname in ES modules
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// FIX: Define __dirname for compatibility with path.resolve
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
        output: {
            manualChunks: {
                vendor: ['react', 'react-dom'],
                icons: ['./components/Icons.tsx']
            }
        }
    }
  }
});