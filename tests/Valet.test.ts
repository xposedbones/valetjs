import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Valet } from '../src/Valet.js';
import { Directive } from '../src/Directive.js';
import { directiveRegistry, clearRegistry } from '../src/Registry.js';
import { stopObserver } from '../src/Observer.js';
import type { DirectiveConstructor } from '../src/types.js';

class TestDirective extends Directive {
  static override selector = '.test-el';
  initCalled = false;

  override onInit() {
    this.initCalled = true;
  }
}

const TestCtor = TestDirective as unknown as DirectiveConstructor<TestDirective>;

describe('Valet', () => {
  beforeEach(() => {
    clearRegistry();
    stopObserver();
    document.body.innerHTML = '';
  });

  describe('init', () => {
    it('registers directives and scans the DOM', async () => {
      const el = document.createElement('div');
      el.classList.add('test-el');
      document.body.appendChild(el);

      await Valet.init({ directives: [TestCtor] });

      expect(el.directives).toBeDefined();
      expect(el.directives!.has(TestCtor)).toBe(true);
    });

    it('re-init clears previous state', async () => {
      await Valet.init({ directives: [TestCtor] });
      expect(directiveRegistry.size).toBe(1);

      await Valet.init({});
      expect(directiveRegistry.size).toBe(0);
    });

    it('lazy import resolves and registers directives', async () => {
      const el = document.createElement('div');
      el.classList.add('lazy-sel');
      document.body.appendChild(el);

      class LazyDirective extends Directive {
        static override selector = '.lazy-sel';
      }

      await Valet.init({
        lazy: {
          '.lazy-sel': Promise.resolve({ default: LazyDirective }),
        },
      });

      expect(directiveRegistry.has('.lazy-sel')).toBe(true);
      expect(el.directives).toBeDefined();
    });

    it('lazy import uses key as selector when directive has none', async () => {
      class NoSelDirective extends Directive {}

      await Valet.init({
        lazy: {
          '.auto-sel': Promise.resolve({ default: NoSelDirective }),
        },
      });

      expect(directiveRegistry.has('.auto-sel')).toBe(true);
      expect(NoSelDirective.selector).toBe('.auto-sel');
    });

    it('lazy import skips non-directive exports', async () => {
      class FakeComponent {}

      await Valet.init({
        lazy: {
          'my-comp': Promise.resolve({ default: FakeComponent }),
        },
      });

      expect(directiveRegistry.size).toBe(0);
    });
  });

  describe('getDirective', () => {
    it('resolves immediately when directive is present', async () => {
      const el = document.createElement('div');
      el.classList.add('test-el');
      document.body.appendChild(el);

      await Valet.init({ directives: [TestCtor] });

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
    it('returns directive instances from descendants', async () => {
      const wrapper = document.createElement('div');
      const child1 = document.createElement('span');
      child1.classList.add('test-el');
      const child2 = document.createElement('p');
      child2.classList.add('test-el');
      wrapper.appendChild(child1);
      wrapper.appendChild(child2);
      document.body.appendChild(wrapper);

      await Valet.init({ directives: [TestCtor] });

      const directives = Valet.getChildDirectives(wrapper);
      expect(directives.length).toBe(2);
      expect(directives.every((d) => d instanceof TestDirective)).toBe(true);
    });

    it('excludes the node itself', async () => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('test-el');
      const child = document.createElement('span');
      child.classList.add('test-el');
      wrapper.appendChild(child);
      document.body.appendChild(wrapper);

      await Valet.init({ directives: [TestCtor] });

      const directives = Valet.getChildDirectives(wrapper);
      expect(directives.length).toBe(1);
    });

    it('returns empty array when no directives exist', () => {
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);

      const directives = Valet.getChildDirectives(wrapper);
      expect(directives).toEqual([]);
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
