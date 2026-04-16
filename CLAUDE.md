# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build                    # Library build (ESM + CJS + .d.ts) via tsup → dist/
npm run build:demo               # Build demo site → demo-dist/ (base path /valetjs/ in production)
npm run dev                      # Vite dev server for demo on localhost:3000
npm test                         # Run all tests (vitest, jsdom)
npm run test:watch               # Tests in watch mode
npx vitest run tests/Valet.test.ts           # Run a single test file
npx vitest run -t "directive name"           # Run tests matching a name pattern
```

`lit` is a peer dependency (required by `WebComponent`).

## Architecture

Valet is a ~small DOM lifecycle library built around a `MutationObserver`. Everything flows through a single pipeline:

```
Valet.init() ──► Registry (selector → DirectiveClass) ──► Scanner (walk DOM, mount) ──► Observer (watch DOM for changes)
                                                              │
                                                              ▼
                                                   Element.directives (Map<Ctor, instance>)
```

### Module responsibilities

- **`Valet.ts`** — public façade. `init()` registers eager directives, registers lazy loaders, does an initial scan, checks lazy selectors against the DOM (firing only the loaders whose selectors match), and starts the observer. Also owns the pub/sub event bus and `destroy()` which tears everything down.
- **`Lazy.ts`** — pending-loader registry. `checkLazy(root)` is the trigger: it walks `lazyLoaders`, and for each selector found in `root` (via `matches` or `querySelector`) it removes the entry and invokes the loader. Loaders fire at most once. When the promise resolves, the default export is either registered as a directive (which triggers another `scanDirectives(document)`) or ignored (custom elements self-register via `@customElement`).
- **`Registry.ts`** — module-level `Map<selector, DirectiveConstructor>`. Keyed by selector, so the same class registered twice is a no-op.
- **`Scanner.ts`** — walks a root element/document and mounts directives. Stamps mounted elements with `valet-element` attribute so the observer can find them on removal. `destroyDirectivesIn` uses the `[valet-element]` attribute to find descendants to clean up (the attribute is the source of truth for "has directives" — don't rely on the `.directives` map alone for subtree traversal).
- **`Observer.ts`** — single module-level `MutationObserver`. On each batch: destroy removed subtrees first, then for every added subtree call `checkLazy` (may trigger a pending dynamic import) followed by `scanDirectives`. Only one observer exists at a time; `startObserver` disconnects any previous one.
- **`Directive.ts`** — base class. Subclasses define `static selector` and override `onInit`/`onDestroy`. `host` is set by the Scanner before `onInit` fires.
- **`WebComponent.ts`** — thin `LitElement` subclass that stamps `valet-component` on connect and calls `onInit`/`onDestroy` mirroring the directive lifecycle. Native components self-register via Lit's `@customElement` decorator; Valet does not register custom elements itself.
- **`types.ts`** — augments the global `Element` interface with `directives?: DirectiveMap`, which is what gives `el.directives?.get(MyDirective)` its inferred return type.

### Lazy loading contract

`Valet.init({ lazy: { '<selector-or-tag>': () => import('...') } })`:
- Values are **loader functions**, not promises. The dynamic import only fires when an element matching the key is found in the DOM — initially by `checkLazy(document)` or later when the observer sees a matching element added. If nothing ever matches, the module is never fetched. (Passing a bare `Promise` — e.g. `import(...)` without the `() =>` wrapper — silently defeats lazy loading because the import starts at the call site.)
- The **key** doubles as the `static selector` on the loaded Directive class if the class doesn't set one itself (see `resolveLazyImport` in `Lazy.ts`).
- Each loader fires at most once (its entry is deleted from the registry before invocation).
- The default export must be either a `Directive` subclass (registered, then `scanDirectives(document)` runs) or a custom element class (no-op here; it self-registers via `@customElement`). Anything else logs a warning.

### Two attribute markers, two subsystems

- `valet-element` — stamped by the Scanner on any element with directives. Used by Observer/Scanner cleanup.
- `valet-component` — stamped by `WebComponent.connectedCallback`. Used by `Valet.getChildComponents`.

These are distinct on purpose: directives and web components have parallel but separate tracking.

### Testing

Vitest runs under `jsdom`. Tests in `tests/` mirror the source modules. `Valet.init` mutates global state (registry, observer, listeners) — tests reset by calling `Valet.destroy()` in their teardown.

### Demo / local library resolution

`demo/` is a separate Vite app that imports `'valetjs'`. `vite.config.ts` has a custom `valetAlias` plugin that resolves `'valetjs'` → `src/index.ts` so the demo always runs against live source (no rebuild needed during `npm run dev`). Production demo builds use base path `/valetjs/` for GitHub Pages.
