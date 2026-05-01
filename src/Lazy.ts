import { Directive } from './Directive.js';
import type { DirectiveConstructor, LazyLoader } from './types.js';
import { registerDirective } from './Registry.js';
import { scanDirectives } from './Scanner.js';

const lazyLoaders = new Map<string, LazyLoader>();

export function registerLazy(selector: string, loader: LazyLoader): void {
  lazyLoaders.set(selector, loader);
}

export function clearLazy(): void {
  lazyLoaders.clear();
}

function resolveLazyImport(key: string, mod: Record<string, unknown>): void {
  const exports = Object.values(mod).filter(
    (v): v is Function => typeof v === 'function',
  );

  if (exports.length === 0) {
    console.warn(`[Valet] Lazy export for "${key}" is not a Directive or Component class. Skipping.`);
    return;
  }

  const directives = exports.filter(
    (v) => v.prototype instanceof Directive,
  ) as unknown as DirectiveConstructor[];

  // Components self-register via @customElement — non-Directive function exports are no-ops.
  if (directives.length === 0) return;

  for (const D of directives) {
    if (!D.selector) {
      if (directives.length === 1) {
        D.selector = key;
      } else {
        console.warn(`[Valet] Lazy directive "${D.name || 'anonymous'}" for "${key}" has no static selector. Skipping.`);
        continue;
      }
    }
    registerDirective(D);
  }

  scanDirectives(document);
}

export function checkLazy(root: Element | Document): void {
  if (lazyLoaders.size === 0) return;

  for (const [selector, loader] of lazyLoaders) {
    const matches =
      (root instanceof Element && root.matches(selector)) ||
      !!root.querySelector(selector);

    if (!matches) continue;

    lazyLoaders.delete(selector);
    loader().then((mod) => resolveLazyImport(selector, mod));
  }
}
