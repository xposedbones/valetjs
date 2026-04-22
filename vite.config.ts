import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const root = dirname(fileURLToPath(import.meta.url));
const srcEntry = resolve(root, 'src/index.ts');

function valetAlias(): Plugin {
  return {
    name: 'valet-alias',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'valetjs') {
        return srcEntry;
      }
    },
  };
}

function chunkSizesManifest(): Plugin {
  return {
    name: 'chunk-sizes-manifest',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const eager = new Set<string>();
        const queue: string[] = [];
        for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            eager.add(fileName);
            queue.push(fileName);
          }
        }
        while (queue.length) {
          const f = queue.shift()!;
          const chunk = ctx.bundle[f];
          if (chunk?.type !== 'chunk') continue;
          for (const imp of chunk.imports) {
            if (!eager.has(imp)) { eager.add(imp); queue.push(imp); }
          }
        }

        const sizes: Record<string, { gzip: number; raw: number; dynamic: boolean }> = {};
        for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
          if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
            const raw = Buffer.byteLength(chunk.code);
            const gzip = gzipSync(chunk.code).length;
            sizes[fileName] = { gzip, raw, dynamic: !eager.has(fileName) };
          }
        }

        const tag = `<script id="chunk-sizes" type="application/json">${JSON.stringify(sizes)}</script>`;
        return html.replace('</head>', `  ${tag}\n</head>`);
      },
    },
  };
}

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  root: 'demo',
  base: isProduction ? '/valetjs/' : '/',
  plugins: [valetAlias(), chunkSizesManifest()],
  optimizeDeps: {
    exclude: ['valetjs'],
  },
  build: {
    outDir: resolve(root, 'demo-dist'),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
