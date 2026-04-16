import { describe, it, expect, beforeEach } from 'vitest';
import { Directive } from '../src/Directive.js';
import { registerDirective, clearRegistry } from '../src/Registry.js';
import {
  scanDirectives,
  destroyDirectivesOn,
  destroyDirectivesIn,
} from '../src/Scanner.js';
import type { DirectiveConstructor } from '../src/types.js';

class HighlightDirective extends Directive {
  static override selector = '.highlight';
  initCalled = false;
  destroyCalled = false;

  override onInit() {
    this.initCalled = true;
  }

  override onDestroy() {
    this.destroyCalled = true;
  }
}

class TooltipDirective extends Directive {
  static override selector = '.tooltip';
  initCalled = false;
  destroyCalled = false;

  override onInit() {
    this.initCalled = true;
  }

  override onDestroy() {
    this.destroyCalled = true;
  }
}

const Highlight = HighlightDirective as unknown as DirectiveConstructor;
const Tooltip = TooltipDirective as unknown as DirectiveConstructor;

describe('Scanner', () => {
  beforeEach(() => {
    clearRegistry();
    document.body.innerHTML = '';
  });

  describe('scanDirectives', () => {
    it('attaches instance to matching element', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);

      expect(el.directives).toBeDefined();
      expect(el.directives!.size).toBe(1);
      expect(el.directives!.get(Highlight)).toBeInstanceOf(HighlightDirective);
    });

    it('skips already-mounted directives (no double-init)', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);
      const first = el.directives!.get(Highlight);

      scanDirectives(document);
      const second = el.directives!.get(Highlight);

      expect(first).toBe(second);
      expect(el.directives!.size).toBe(1);
    });

    it('sets host before calling onInit', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);

      const instance = el.directives!.get(Highlight) as HighlightDirective;
      expect(instance.host).toBe(el);
      expect(instance.initCalled).toBe(true);
    });

    it('matches the root element itself', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(el);

      expect(el.directives!.size).toBe(1);
      expect((el.directives!.get(Highlight) as HighlightDirective).initCalled).toBe(true);
    });

    it('sets valet-element attribute on mount', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);

      expect(el.hasAttribute('valet-element')).toBe(true);
    });

    it('mounts multiple directives on the same element', () => {
      registerDirective(Highlight);
      registerDirective(Tooltip);
      const el = document.createElement('div');
      el.classList.add('highlight', 'tooltip');
      document.body.appendChild(el);

      scanDirectives(document);

      expect(el.directives!.size).toBe(2);
      expect(el.directives!.get(Highlight)).toBeInstanceOf(HighlightDirective);
      expect(el.directives!.get(Tooltip)).toBeInstanceOf(TooltipDirective);
    });

    it('does not mount on non-matching elements', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('other');
      document.body.appendChild(el);

      scanDirectives(document);

      expect(el.directives).toBeUndefined();
    });
  });

  describe('destroyDirectivesOn', () => {
    it('calls onDestroy and clears the map', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);
      const instance = el.directives!.get(Highlight) as HighlightDirective;

      destroyDirectivesOn(el);

      expect(instance.destroyCalled).toBe(true);
      expect(el.directives!.size).toBe(0);
    });

    it('removes valet-element attribute', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);
      destroyDirectivesOn(el);

      expect(el.hasAttribute('valet-element')).toBe(false);
    });

    it('is a no-op on elements without directives', () => {
      const el = document.createElement('div');
      expect(() => destroyDirectivesOn(el)).not.toThrow();
    });

    it('calls onDestroy on all directives when element has multiple', () => {
      registerDirective(Highlight);
      registerDirective(Tooltip);
      const el = document.createElement('div');
      el.classList.add('highlight', 'tooltip');
      document.body.appendChild(el);

      scanDirectives(document);
      const h = el.directives!.get(Highlight) as HighlightDirective;
      const t = el.directives!.get(Tooltip) as TooltipDirective;

      destroyDirectivesOn(el);

      expect(h.destroyCalled).toBe(true);
      expect(t.destroyCalled).toBe(true);
      expect(el.directives!.size).toBe(0);
    });
  });

  describe('destroyDirectivesIn', () => {
    it('recurses into children', () => {
      registerDirective(Highlight);
      const parent = document.createElement('div');
      const child = document.createElement('span');
      child.classList.add('highlight');
      parent.appendChild(child);
      document.body.appendChild(parent);

      scanDirectives(document);
      const instance = child.directives!.get(Highlight) as HighlightDirective;

      destroyDirectivesIn(parent);

      expect(instance.destroyCalled).toBe(true);
      expect(child.directives!.size).toBe(0);
    });

    it('destroys the root element itself', () => {
      registerDirective(Highlight);
      const el = document.createElement('div');
      el.classList.add('highlight');
      document.body.appendChild(el);

      scanDirectives(document);
      const instance = el.directives!.get(Highlight) as HighlightDirective;

      destroyDirectivesIn(el);

      expect(instance.destroyCalled).toBe(true);
    });

    it('handles deep nesting', () => {
      registerDirective(Highlight);
      const root = document.createElement('div');
      const mid = document.createElement('div');
      const deep = document.createElement('span');
      deep.classList.add('highlight');
      mid.appendChild(deep);
      root.appendChild(mid);
      document.body.appendChild(root);

      scanDirectives(document);
      const instance = deep.directives!.get(Highlight) as HighlightDirective;

      destroyDirectivesIn(root);

      expect(instance.destroyCalled).toBe(true);
    });
  });
});
