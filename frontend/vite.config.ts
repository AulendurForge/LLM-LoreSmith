/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Configure React refresh options if needed
    }),
    svgr()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true, // This enables Jest-like globals (describe, it, expect)
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      exclude: ['node_modules/']
    }
  },
  server: {
    // Explicitly set the port to 3000
    port: 3000,
    strictPort: true, // Fail if port is already in use
    // Enable HMR in Docker
    watch: {
      usePolling: true,
      interval: 100, // Poll every 100ms
      binaryInterval: 300, // Poll binary files every 300ms
    },
    // Host setting to expose outside of container
    host: '0.0.0.0',
    // Allow remote connection in Docker
    cors: true,
    // HMR configuration
    hmr: {
      clientPort: 3000,
      overlay: true, // Show errors in browser overlay
      timeout: 1000, // Longer timeout for connection
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
}); 