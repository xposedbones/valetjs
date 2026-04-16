import type { DirectiveConstructor } from './types.js';

export const directiveRegistry = new Map<string, DirectiveConstructor>();

export function registerDirective(DirectiveClass: DirectiveConstructor): void {
  const selector = DirectiveClass.selector;
  if (!selector) {
    throw new Error(`Directive ${DirectiveClass.name} has no static selector defined.`);
  }
  if (directiveRegistry.has(selector)) {
    return; // dedupe — silently skip if already registered
  }
  directiveRegistry.set(selector, DirectiveClass);
}

export function clearRegistry(): void {
  directiveRegistry.clear();
}
