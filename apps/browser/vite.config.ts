import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: [
                'ipfs-http-client',
                'electron',
                '@frw/common',
                '@frw/crypto',
                '@frw/ipfs',
                '@frw/protocol',
                '@frw/name-registry'
              ]
            }
          }
        }
      },
      {
        entry: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  build: {
    outDir: 'dist/renderer'
  }
});
