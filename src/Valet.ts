import type { ValetOptions, DirectiveConstructor, EventHandler } from './types.js';
import { Directive } from './Directive.js';
import type { WebComponent } from './WebComponent.js';
import { clearRegistry, registerDirective } from './Registry.js';
import { scanDirectives, destroyDirectivesIn } from './Scanner.js';
import { startObserver, stopObserver } from './Observer.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Valet {
  private static listeners = new Map<string, Set<EventHandler>>();

  static on(event: string, handler: EventHandler): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler);
  }

  static off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  static emit(event: string, data?: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      handler(data);
    }
  }

  static destroy(): void {
    stopObserver();
    destroyDirectivesIn(document.body);
    clearRegistry();
    this.listeners.clear();
  }

  private static resolveLazyImport(key: string, mod: { default: unknown }): void {
    const Exported = mod.default;

    if (typeof Exported === 'function' && Exported.prototype instanceof Directive) {
      const DirectiveClass = Exported as unknown as DirectiveConstructor;
      if (!DirectiveClass.selector) {
        DirectiveClass.selector = key;
      }
      registerDirective(DirectiveClass);
      scanDirectives(document);
    } else if (typeof Exported === 'function') {
      // Components self-register via @customElement — nothing to do
    } else {
      console.warn(`[Valet] Lazy export for "${key}" is not a Directive or Component class. Skipping.`);
    }
  }

  static init(options: ValetOptions = {}): void {
    this.destroy();

    if (options.directives) {
      for (const DirectiveClass of options.directives) {
        registerDirective(DirectiveClass);
      }
    }

    scanDirectives(document);
    startObserver(document.body);

    if (options.lazy) {
      for (const [key, promise] of Object.entries(options.lazy)) {
        promise.then((mod) => this.resolveLazyImport(key, mod));
      }
    }
  }

  static async getDirective<T extends Directive>(
    node: Element,
    DirectiveClass: DirectiveConstructor<T>,
    retries = 10,
    interval = 50,
  ): Promise<T> {
    const immediate = node.directives?.get(DirectiveClass);
    if (immediate) return immediate;

    for (let attempt = 1; attempt < retries; attempt++) {
      await sleep(interval);
      const instance = node.directives?.get(DirectiveClass);
      if (instance) return instance;
    }

    throw new Error(
      `Directive ${DirectiveClass.name} not found on <${node.tagName.toLowerCase()}> after ${retries} retries.`,
    );
  }

  static getChildComponents(node: Element): WebComponent[] {
    const elements = node.querySelectorAll('[valet-component]');
    const result: WebComponent[] = [];

    for (const el of elements) {
      result.push(el as unknown as WebComponent);
    }

    return result;
  }

  static getChildDirectives(node: Element): Directive[] {
    const result: Directive[] = [];

    for (const el of node.querySelectorAll('[valet-element]')) {
      if (el.directives) {
        for (const [, instance] of el.directives) {
          result.push(instance);
        }
      }
    }

    return result;
  }
}
