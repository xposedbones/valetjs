import type { ValetOptions, DirectiveConstructor, EventHandler } from './types.js';
import type { Directive } from './Directive.js';
import type { WebComponent } from './WebComponent.js';
import { clearRegistry, registerDirective } from './Registry.js';
import { scanDirectives, destroyDirectivesIn } from './Scanner.js';
import { startObserver, stopObserver } from './Observer.js';
import { registerLazy, checkLazy, clearLazy } from './Lazy.js';

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
    clearLazy();
    this.listeners.clear();
  }

  static init(options: ValetOptions = {}): void {
    this.destroy();

    if (options.directives) {
      for (const DirectiveClass of options.directives) {
        registerDirective(DirectiveClass);
      }
    }

    if (options.lazy) {
      for (const [selector, loader] of Object.entries(options.lazy)) {
        registerLazy(selector, loader);
      }
    }

    scanDirectives(document);
    checkLazy(document);
    startObserver(document.body);
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
