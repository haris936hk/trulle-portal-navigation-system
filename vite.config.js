import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
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
    <link rel="stylesheet" href="./portal-nav.css" />
    <style>
      html, body { margin: 0; width: 100%; height: 100%; background: #fcfcfc; }
      .trulle-portal-root { width: 100vw; min-height: 56.25vw; max-height: 100vh; }
      #portal-load-error {
        position: fixed;
        inset: auto 16px 16px 16px;
        z-index: 99999;
        padding: 10px 12px;
        border: 1px solid #b30000;
        background: #fff5f5;
        color: #7a0000;
        font: 14px/1.4 sans-serif;
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="trulle-portal-root" data-trulle-portal-root="1"></div>
    <div id="portal-load-error">Portal bundle failed to load. Check console/network for portal-nav.iife.js.</div>
    <script>
      // Some bundled deps still read process.env.NODE_ENV in browser runtime.
      // Provide a safe shim for static preview hosts like Vercel.
      window.process = window.process || { env: { NODE_ENV: 'production' } };
    </script>
    <script>
      window.addEventListener('error', function (e) {
        if (e && e.filename && e.filename.indexOf('portal-nav.iife.js') !== -1) {
          var el = document.getElementById('portal-load-error');
          if (el) el.style.display = 'block';
        }
      });
    </script>
    <script src="./portal-nav.iife.js"></script>
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
