import { describe, it, expect, vi } from 'vitest';
import { Directive } from '../src/Directive.js';

describe('Directive', () => {
  it('can be instantiated', () => {
    const d = new Directive();
    expect(d).toBeInstanceOf(Directive);
  });

  it('has a static selector defaulting to empty string', () => {
    expect(Directive.selector).toBe('');
  });

  it('host can be set and read back', () => {
    const d = new Directive();
    const el = document.createElement('div');
    d.host = el;
    expect(d.host).toBe(el);
  });

  it('onInit and onDestroy are callable stubs', () => {
    const d = new Directive();
    expect(() => d.onInit()).not.toThrow();
    expect(() => d.onDestroy()).not.toThrow();
  });

  it('subclass with generic narrows host type correctly', () => {
    class ButtonDirective extends Directive<HTMLButtonElement> {
      static override selector = '.btn';
      getLabel(): string {
        return this.host.textContent ?? '';
      }
    }

    const bd = new ButtonDirective();
    const btn = document.createElement('button');
    btn.textContent = 'Click me';
    bd.host = btn;
    expect(bd.getLabel()).toBe('Click me');
    expect(ButtonDirective.selector).toBe('.btn');
  });
});
