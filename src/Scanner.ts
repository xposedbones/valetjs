import type { DirectiveConstructor, DirectiveMap } from './types.js';
import { directiveRegistry } from './Registry.js';

const VALET_ATTR = 'valet-element';

function mountDirective(el: Element, DirectiveClass: DirectiveConstructor): void {
  if (!el.directives) {
    el.directives = new Map() as DirectiveMap;
  }
  if (el.directives.has(DirectiveClass)) {
    return;
  }

  const instance = new DirectiveClass();
  instance.host = el as HTMLElement;
  el.directives.set(DirectiveClass, instance);

  if (!el.hasAttribute(VALET_ATTR)) {
    el.setAttribute(VALET_ATTR, '');
  }

  instance.onInit();
}

export function scanDirectives(root: Element | Document): void {
  for (const [selector, DirectiveClass] of directiveRegistry) {
    if (root instanceof Element && root.matches(selector)) {
      mountDirective(root, DirectiveClass);
    }

    for (const el of root.querySelectorAll(selector)) {
      mountDirective(el, DirectiveClass);
    }
  }
}

export function destroyDirectivesOn(el: Element): void {
  if (!el.directives) return;

  for (const [, instance] of el.directives) {
    instance.onDestroy();
  }
  el.directives.clear();
  el.removeAttribute(VALET_ATTR);
}

export function destroyDirectivesIn(root: Element): void {
  for (const el of root.querySelectorAll(`[${VALET_ATTR}]`)) {
    destroyDirectivesOn(el);
  }
  destroyDirectivesOn(root);
}
