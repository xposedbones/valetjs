import type { ValetOptions, DirectiveConstructor, EventHandler } from './types.js';
import { Directive } from './Directive.js';
import type { WebComponent } from './WebComponent.js';
import { clearRegistry, registerDirective, componentInstances } from './Registry.js';
import { scanDirectives } from './Scanner.js';
import { startObserver } from './Observer.js';

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

  static async init(options: ValetOptions = {}): Promise<void> {
    clearRegistry();

    if (options.directives) {
      for (const DirectiveClass of options.directives) {
        registerDirective(DirectiveClass);
      }
    }

    if (options.lazy) {
      const entries = Object.entries(options.lazy);
      const modules = await Promise.all(entries.map(([, p]) => p));

      for (const [i, [key]] of entries.entries()) {
        const Exported = modules[i].default;

        if (typeof Exported === 'function' && Exported.prototype instanceof Directive) {
          const DirectiveClass = Exported as unknown as DirectiveConstructor;
          if (!DirectiveClass.selector) {
            DirectiveClass.selector = key;
          }
          registerDirective(DirectiveClass);
        }
      }
    }

    scanDirectives(document);
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
    const result: WebComponent[] = [];

    for (const component of componentInstances) {
      if (node !== component && node.contains(component)) {
        result.push(component);
      }
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
