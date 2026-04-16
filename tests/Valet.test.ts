import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Valet } from '../src/Valet.js';
import { Directive } from '../src/Directive.js';
import { directiveRegistry } from '../src/Registry.js';
import type { DirectiveConstructor } from '../src/types.js';

class TestDirective extends Directive {
  static override selector = '.test-el';
  initCalled = false;
  destroyCalled = false;

  override onInit() {
    this.initCalled = true;
  }

  override onDestroy() {
    this.destroyCalled = true;
  }
}

const TestCtor = TestDirective as unknown as DirectiveConstructor<TestDirective>;

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Valet', () => {
  beforeEach(() => {
    Valet.destroy();
    document.body.innerHTML = '';
  });

  describe('init', () => {
    it('registers directives and scans the DOM synchronously', () => {
      const el = document.createElement('div');
      el.classList.add('test-el');
      document.body.appendChild(el);

      Valet.init({ directives: [TestCtor] });

      expect(el.directives).toBeDefined();
      expect(el.directives!.has(TestCtor)).toBe(true);
    });

    it('re-init destroys previous directives and clears state', () => {
      const el = document.createElement('div');
      el.classList.add('test-el');
      document.body.appendChild(el);

      Valet.init({ directives: [TestCtor] });
      const instance = el.directives!.get(TestCtor) as TestDirective;

      Valet.init({});

      expect(instance.destroyCalled).toBe(true);
      expect(directiveRegistry.size).toBe(0);
    });

    it('re-init clears event listeners', () => {
      const handler = vi.fn();
      Valet.on('test', handler);

      Valet.init({});
      Valet.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('lazy import resolves progressively and scans', async () => {
      const el = document.createElement('div');
      el.classList.add('lazy-sel');
      document.body.appendChild(el);

      class LazyDirective extends Directive {
        static override selector = '.lazy-sel';
      }

      Valet.init({
        lazy: {
          '.lazy-sel': Promise.resolve({ default: LazyDirective }),
        },
      });

      // Eager scan happens synchronously — lazy hasn't resolved yet
      expect(el.directives).toBeUndefined();

      // Flush microtask — lazy resolves and scans
      await flush();

      expect(directiveRegistry.has('.lazy-sel')).toBe(true);
      expect(el.directives).toBeDefined();
    });

    it('lazy import uses key as selector when directive has none', async () => {
      class NoSelDirective extends Directive {}

      Valet.init({
        lazy: {
          '.auto-sel': Promise.resolve({ default: NoSelDirective }),
        },
      });

      await flush();

      expect(directiveRegistry.has('.auto-sel')).toBe(true);
      expect(NoSelDirective.selector).toBe('.auto-sel');
    });

    it('lazy import skips component classes silently', async () => {
      class FakeComponent {}
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Valet.init({
        lazy: {
          'my-comp': Promise.resolve({ default: FakeComponent }),
        },
      });

      await flush();

      expect(directiveRegistry.size).toBe(0);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('lazy import warns on non-function exports', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Valet.init({
        lazy: {
          '.broken': Promise.resolve({ default: 'not a class' }),
        },
      });

      await flush();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('.broken'),
      );
      warnSpy.mockRestore();
    });

    it('eager directives mount before lazy ones resolve', async () => {
      const order: string[] = [];

      class EagerDirective extends Directive {
        static override selector = '.eager';
        override onInit() { order.push('eager'); }
      }
      class LazyDirective extends Directive {
        static override selector = '.lazy';
        override onInit() { order.push('lazy'); }
      }

      const eager = document.createElement('div');
      eager.classList.add('eager');
      const lazy = document.createElement('div');
      lazy.classList.add('lazy');
      document.body.append(eager, lazy);

      Valet.init({
        directives: [EagerDirective as unknown as DirectiveConstructor],
        lazy: {
          '.lazy': Promise.resolve({ default: LazyDirective }),
        },
      });

      expect(order).toEqual(['eager']);

      await flush();

      expect(order).toEqual(['eager', 'lazy']);
    });
  });

  describe('destroy', () => {
    it('calls onDestroy on all mounted directives', () => {
      const el = document.createElement('div');
      el.classList.add('test-el');
      document.body.appendChild(el);

      Valet.init({ directives: [TestCtor] });
      const instance = el.directives!.get(TestCtor) as TestDirective;

      Valet.destroy();

      expect(instance.destroyCalled).toBe(true);
    });

    it('clears the directive registry', () => {
      Valet.init({ directives: [TestCtor] });

      Valet.destroy();

      expect(directiveRegistry.size).toBe(0);
    });

    it('clears event listeners', () => {
      const handler = vi.fn();
      Valet.on('test', handler);

      Valet.destroy();
      Valet.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('is safe to call multiple times', () => {
      expect(() => {
        Valet.destroy();
        Valet.destroy();
      }).not.toThrow();
    });
  });

  describe('getDirective', () => {
    it('resolves immediately when directive is present', async () => {
      const el = document.createElement('div');
      el.classList.add('test-el');
      document.body.appendChild(el);

      Valet.init({ directives: [TestCtor] });

      const instance = await Valet.getDirective(el, TestCtor);
      expect(instance).toBeInstanceOf(TestDirective);
      expect(instance.initCalled).toBe(true);
    });

    it('retries and rejects after max retries', async () => {
      const el = document.createElement('div');

      await expect(
        Valet.getDirective(el, TestCtor, 3, 10),
      ).rejects.toThrow(/not found/i);
    });

    it('error message includes element tag and directive name', async () => {
      const el = document.createElement('span');

      await expect(
        Valet.getDirective(el, TestCtor, 1, 10),
      ).rejects.toThrow(/TestDirective.*<span>/i);
    });
  });

  describe('getChildDirectives', () => {
    it('returns directive instances from descendants', () => {
      const wrapper = document.createElement('div');
      const child1 = document.createElement('span');
      child1.classList.add('test-el');
      const child2 = document.createElement('p');
      child2.classList.add('test-el');
      wrapper.appendChild(child1);
      wrapper.appendChild(child2);
      document.body.appendChild(wrapper);

      Valet.init({ directives: [TestCtor] });

      const directives = Valet.getChildDirectives(wrapper);
      expect(directives.length).toBe(2);
      expect(directives.every((d) => d instanceof TestDirective)).toBe(true);
    });

    it('excludes the node itself', () => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('test-el');
      const child = document.createElement('span');
      child.classList.add('test-el');
      wrapper.appendChild(child);
      document.body.appendChild(wrapper);

      Valet.init({ directives: [TestCtor] });

      const directives = Valet.getChildDirectives(wrapper);
      expect(directives.length).toBe(1);
    });

    it('returns empty array when no directives exist', () => {
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);

      expect(Valet.getChildDirectives(wrapper)).toEqual([]);
    });
  });

  describe('events', () => {
    it('on registers a handler that receives emit data', () => {
      const handler = vi.fn();
      Valet.on('test', handler);
      Valet.emit('test', { foo: 'bar' });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ foo: 'bar' });

      Valet.off('test', handler);
    });

    it('emit without data calls handler with undefined', () => {
      const handler = vi.fn();
      Valet.on('test', handler);
      Valet.emit('test');

      expect(handler).toHaveBeenCalledWith(undefined);

      Valet.off('test', handler);
    });

    it('off removes a handler', () => {
      const handler = vi.fn();
      Valet.on('test', handler);
      Valet.off('test', handler);
      Valet.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('off on non-existent event does not throw', () => {
      const handler = vi.fn();
      expect(() => Valet.off('nonexistent', handler)).not.toThrow();
    });

    it('emit with no listeners does not throw', () => {
      expect(() => Valet.emit('nonexistent', 123)).not.toThrow();
    });

    it('multiple handlers on the same event all fire', () => {
      const a = vi.fn();
      const b = vi.fn();
      Valet.on('multi', a);
      Valet.on('multi', b);
      Valet.emit('multi', 'hello');

      expect(a).toHaveBeenCalledWith('hello');
      expect(b).toHaveBeenCalledWith('hello');

      Valet.off('multi', a);
      Valet.off('multi', b);
    });

    it('same handler registered twice only fires once (Set dedup)', () => {
      const handler = vi.fn();
      Valet.on('dedup', handler);
      Valet.on('dedup', handler);
      Valet.emit('dedup', 'x');

      expect(handler).toHaveBeenCalledTimes(1);

      Valet.off('dedup', handler);
    });
  });
});
