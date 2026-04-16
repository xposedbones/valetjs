import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  root: 'demo',
  base: isProduction ? '/valetjs/' : '/',
  plugins: [valetAlias()],
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
