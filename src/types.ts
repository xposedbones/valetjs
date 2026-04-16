import type { Directive } from './Directive.js';

/** A Directive class with a static `selector` used for DOM matching. */
export interface DirectiveConstructor<T extends Directive = Directive> {
  new (): T;
  selector: string;
}

/** A function that returns a dynamic import — only invoked when its selector matches. */
export type LazyLoader = () => Promise<{ default: unknown }>;

/** Options passed to `Valet.init()`. */
export interface ValetOptions {
  directives?: DirectiveConstructor[];
  lazy?: Record<string, LazyLoader>;
}

/** Handler for Valet events. */
export type EventHandler = (data?: unknown) => void;

/** A Map that infers the directive subclass from the constructor key. */
export interface DirectiveMap extends Map<DirectiveConstructor, Directive> {
  get<T extends Directive>(key: DirectiveConstructor<T>): T | undefined;
  set<T extends Directive>(key: DirectiveConstructor<T>, value: T): this;
}

/** Augment the global `Element` interface so `.directives` is fully typed. */
declare global {
  interface Element {
    directives?: DirectiveMap;
  }
}
