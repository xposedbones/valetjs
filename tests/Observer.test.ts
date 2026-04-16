import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Directive } from '../src/Directive.js';
import { registerDirective, clearRegistry } from '../src/Registry.js';
import { startObserver, stopObserver } from '../src/Observer.js';
import type { DirectiveConstructor } from '../src/types.js';

class ObsDirective extends Directive {
  static override selector = '.obs';
  initCalled = false;
  destroyCalled = false;

  override onInit() {
    this.initCalled = true;
  }

  override onDestroy() {
    this.destroyCalled = true;
  }
}

const ObsCtor = ObsDirective as unknown as DirectiveConstructor;

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Observer', () => {
  beforeEach(() => {
    clearRegistry();
    document.body.innerHTML = '';
    registerDirective(ObsCtor);
  });

  afterEach(() => {
    stopObserver();
  });

  it('scans directives on dynamically added elements', async () => {
    startObserver(document.body);

    const el = document.createElement('div');
    el.classList.add('obs');
    document.body.appendChild(el);

    await flush();

    expect(el.directives).toBeDefined();
    expect(el.directives!.get(ObsCtor)).toBeInstanceOf(ObsDirective);
  });

  it('destroys directives on removed elements', async () => {
    const el = document.createElement('div');
    el.classList.add('obs');
    document.body.appendChild(el);

    startObserver(document.body);

    // Manually mount so we have an instance to track
    const { scanDirectives } = await import('../src/Scanner.js');
    scanDirectives(document);
    const instance = el.directives!.get(ObsCtor) as ObsDirective;

    document.body.removeChild(el);
    await flush();

    expect(instance.destroyCalled).toBe(true);
  });

  it('stopObserver prevents further scanning', async () => {
    startObserver(document.body);
    stopObserver();

    const el = document.createElement('div');
    el.classList.add('obs');
    document.body.appendChild(el);

    await flush();

    expect(el.directives).toBeUndefined();
  });

  it('startObserver disconnects previous observer', async () => {
    startObserver(document.body);
    startObserver(document.body);

    const el = document.createElement('div');
    el.classList.add('obs');
    document.body.appendChild(el);

    await flush();

    // Should still work — second observer is active
    expect(el.directives).toBeDefined();
  });

  it('handles nested added elements', async () => {
    startObserver(document.body);

    const parent = document.createElement('div');
    const child = document.createElement('span');
    child.classList.add('obs');
    parent.appendChild(child);
    document.body.appendChild(parent);

    await flush();

    expect(child.directives).toBeDefined();
    expect(child.directives!.get(ObsCtor)).toBeInstanceOf(ObsDirective);
  });
});
