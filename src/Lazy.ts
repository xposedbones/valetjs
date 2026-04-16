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

function resolveLazyImport(key: string, mod: { default: unknown }): void {
  const Exported = mod.default;

  if (typeof Exported === 'function' && Exported.prototype instanceof Directive) {
    const DirectiveClass = Exported as unknown as DirectiveConstructor;
    if (!DirectiveClass.selector) {
      DirectiveClass.selector = key;
    }
    registerDirective(DirectiveClass);
    scanDirectives(document);
  } else if (typeof Exported === 'function') {
    // Components self-register via @customElement — nothing to do
  } else {
    console.warn(`[Valet] Lazy export for "${key}" is not a Directive or Component class. Skipping.`);
  }
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
