import { describe, it, expect, vi } from 'vitest';
import { WebComponent } from '../src/WebComponent.js';

describe('WebComponent', () => {
  it('calls onInit during connectedCallback', () => {
    const initSpy = vi.fn();

    class TestComp extends WebComponent {
      onInit() { initSpy(); }
    }
    const tag = `test-wc-${Math.random().toString(36).slice(2, 8)}`;
    customElements.define(tag, TestComp);

    const el = document.createElement(tag);
    document.body.appendChild(el);

    expect(initSpy).toHaveBeenCalledOnce();
  });

  it('calls onDestroy during disconnectedCallback', () => {
    const destroySpy = vi.fn();

    class TestComp extends WebComponent {
      onDestroy() { destroySpy(); }
    }
    const tag = `test-wc-${Math.random().toString(36).slice(2, 8)}`;
    customElements.define(tag, TestComp);

    const el = document.createElement(tag);
    document.body.appendChild(el);
    document.body.removeChild(el);

    expect(destroySpy).toHaveBeenCalledOnce();
  });

  it('onInit and onDestroy are no-op stubs by default', () => {
    class TestComp extends WebComponent {}
    const tag = `test-wc-${Math.random().toString(36).slice(2, 8)}`;
    customElements.define(tag, TestComp);

    const el = document.createElement(tag);
    expect(() => {
      document.body.appendChild(el);
      document.body.removeChild(el);
    }).not.toThrow();
  });
});
