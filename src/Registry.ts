import type { DirectiveConstructor } from './types.js';
import type { WebComponent } from './WebComponent.js';

export const directiveRegistry = new Map<string, DirectiveConstructor>();
export const componentInstances = new Set<WebComponent>();

export function registerDirective(DirectiveClass: DirectiveConstructor): void {
  const selector = DirectiveClass.selector;
  if (!selector) {
    throw new Error(`Directive ${DirectiveClass.name} has no static selector defined.`);
  }
  if (directiveRegistry.has(selector)) {
    return;
  }
  directiveRegistry.set(selector, DirectiveClass);
}

export function trackComponent(component: WebComponent): void {
  componentInstances.add(component);
}

export function untrackComponent(component: WebComponent): void {
  componentInstances.delete(component);
}

export function clearRegistry(): void {
  directiveRegistry.clear();
  componentInstances.clear();
}
