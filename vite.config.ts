import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// Emits dist/routes.json (the keys of src/routes.ts) so the server knows which
// URLs are real pages and which should get a 404 status.
function routesManifest(): Plugin {
  return {
    name: 'routes-manifest',
    apply: 'build',
    generateBundle() {
      const source = fs.readFileSync(path.resolve(import.meta.dirname, 'src/routes.ts'), 'utf8');
      const routes = [...source.matchAll(/^\s*["'](\/[^"']*)["']\s*:/gm)].map((m) => m[1]);
      this.emitFile({type: 'asset', fileName: 'routes.json', source: JSON.stringify(routes)});
    },
  };
}

// Production builds don't embed source_data.json: the server serves the live file
// as /content.js, so texts edited in the admin apply without rebuilding.
function externalTexts(): Plugin {
  return {
    name: 'external-texts',
    apply: 'build',
    enforce: 'pre',
    load(id) {
      // still JSON: Vite's json plugin turns it into `export default null`
      if (id.replace(/\\/g, '/').endsWith('/source_data.json')) return 'null';
    },
  };
}

export default defineConfig(({isSsrBuild}) => ({
  plugins: [react(), routesManifest(), externalTexts()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    // the server bundle (dist/server, `--ssr`) needs no copy of public/
    copyPublicDir: !isSsrBuild,
    rollupOptions: isSsrBuild
      ? // one file, so server/ssr.mjs can re-import it whole when the texts change
        {output: {inlineDynamicImports: true}}
      : {
          input: {
            main: path.resolve(import.meta.dirname, 'index.html'),
            admin: path.resolve(import.meta.dirname, 'admin.html'),
          },
        },
  },
}));
