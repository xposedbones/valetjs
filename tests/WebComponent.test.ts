import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebComponent } from '../src/WebComponent.js';
import { Valet } from '../src/Valet.js';

function uniqueTag() {
  return `test-wc-${Math.random().toString(36).slice(2, 8)}`;
}

describe('WebComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('calls onInit during connectedCallback', () => {
    const initSpy = vi.fn();

    class TestComp extends WebComponent {
      onInit() { initSpy(); }
    }
    customElements.define(uniqueTag(), TestComp);

    const el = new TestComp();
    document.body.appendChild(el);

    expect(initSpy).toHaveBeenCalledOnce();
  });

  it('calls onDestroy during disconnectedCallback', () => {
    const destroySpy = vi.fn();

    class TestComp extends WebComponent {
      onDestroy() { destroySpy(); }
    }
    customElements.define(uniqueTag(), TestComp);

    const el = new TestComp();
    document.body.appendChild(el);
    document.body.removeChild(el);

    expect(destroySpy).toHaveBeenCalledOnce();
  });

  it('onInit and onDestroy are no-op stubs by default', () => {
    class TestComp extends WebComponent {}
    customElements.define(uniqueTag(), TestComp);

    const el = new TestComp();
    expect(() => {
      document.body.appendChild(el);
      document.body.removeChild(el);
    }).not.toThrow();
  });

  it('sets valet-component attribute on connect', () => {
    class TestComp extends WebComponent {}
    customElements.define(uniqueTag(), TestComp);

    const el = new TestComp();
    document.body.appendChild(el);

    expect(el.hasAttribute('valet-component')).toBe(true);
  });

  it('removes valet-component attribute on disconnect', () => {
    class TestComp extends WebComponent {}
    customElements.define(uniqueTag(), TestComp);

    const el = new TestComp();
    document.body.appendChild(el);
    document.body.removeChild(el);

    expect(el.hasAttribute('valet-component')).toBe(false);
  });

  describe('getChildComponents', () => {
    it('returns components within a parent', () => {
      class TestComp extends WebComponent {}
      customElements.define(uniqueTag(), TestComp);

      const wrapper = document.createElement('div');
      const comp = new TestComp();
      wrapper.appendChild(comp);
      document.body.appendChild(wrapper);

      const result = Valet.getChildComponents(wrapper);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(comp);
    });

    it('excludes the node itself', () => {
      class TestComp extends WebComponent {}
      customElements.define(uniqueTag(), TestComp);

      const comp = new TestComp();
      const child = document.createElement('div');
      comp.appendChild(child);
      document.body.appendChild(comp);

      const result = Valet.getChildComponents(comp);
      expect(result.length).toBe(0);
    });

    it('returns empty array when no components exist', () => {
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);

      expect(Valet.getChildComponents(wrapper)).toEqual([]);
    });

    it('finds nested components', () => {
      class TestComp extends WebComponent {}
      customElements.define(uniqueTag(), TestComp);

      const wrapper = document.createElement('div');
      const inner = document.createElement('div');
      const comp = new TestComp();
      inner.appendChild(comp);
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);

      const result = Valet.getChildComponents(wrapper);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(comp);
    });
  });
});
