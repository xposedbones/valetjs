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

export default defineConfig({
  root: 'demo',
  plugins: [valetAlias()],
  optimizeDeps: {
    exclude: ['valetjs'],
  },
  server: {
    port: 3000,
  },
});
