import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-vercel-preview-index',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trulle Portal Preview</title>
    <link rel="stylesheet" href="/portal-nav.css" />
    <style>
      html, body { margin: 0; width: 100%; height: 100%; background: #fcfcfc; }
    </style>
  </head>
  <body>
    <div id="trulle-portal-root"></div>
    <script src="/portal-nav.iife.js"></script>
  </body>
</html>`,
        });
      },
    },
  ],
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
