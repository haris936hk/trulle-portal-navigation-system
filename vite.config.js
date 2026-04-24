import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'TrullePortal',
      fileName: 'portal-nav',
      formats: ['iife'],
    },
    cssFileName: 'portal-nav',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
