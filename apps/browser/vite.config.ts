import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use relative paths for built assets so they load correctly from file:// URLs in Electron
  base: './',
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
