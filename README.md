# ValetJS

[![npm version](https://img.shields.io/npm/v/valetjs.svg)](https://www.npmjs.com/package/valetjs)

Lightweight directive and web component lifecycle management for the DOM, powered by MutationObserver. Supports lazy-loading, typed directive access, and cross-component events.

## Installation

```bash
npm install valetjs lit
```

## Quick Start

```ts
import { Valet } from 'valetjs';

Valet.init({
  directives: [Carousel],
  lazy: {
    '.js-highlight': () => import('./directives/Highlight.js'),
    'my-counter':    () => import('./components/MyCounter.js'),
  },
});
```

`init()` is synchronous. Eager directives mount instantly and the MutationObserver starts watching right away. Lazy entries are loader **functions**: Valet only invokes a loader when an element matching its selector is present in the DOM (at init time or later, via the observer). The browser only downloads the directives and components the page actually uses.

## Directives

A directive attaches behavior to existing DOM elements matched by a CSS selector.

```ts
import { Directive } from 'valetjs';

class Highlight extends Directive<HTMLDivElement> {
  static selector = '.highlight';

  onInit() {
    this.host.classList.add('highlighted');
  }

  onDestroy() {
    this.host.classList.remove('highlighted');
  }
}
```

| Property | Description |
|---|---|
| `static selector` | CSS selector used to match elements in the DOM |
| `host` | The mounted DOM element (set before `onInit` is called) |
| `onInit()` | Called when the directive is attached |
| `onDestroy()` | Called when the host element is removed from the DOM |

The generic parameter (`Directive<HTMLDivElement>`) narrows the type of `host` for full autocompletion.

## Web Components

Extend `WebComponent` (a thin wrapper around Lit's `LitElement`) and register with `@customElement`.

```ts
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { WebComponent } from 'valetjs';

@customElement('my-counter')
class MyCounter extends WebComponent {
  static styles = css`
    :host { display: block; padding: 1rem; }
  `;

  @property({ type: Number }) count = 0;

  render() {
    return html`
      <p>Count: ${this.count}</p>
      <button @click=${() => this.count++}>+</button>
    `;
  }
}
```

The same `onInit()` and `onDestroy()` hooks are available, mirroring the directive lifecycle.

Native web components (`HTMLElement` subclasses) work alongside Valet without any wrapper. We recommend Lit via `WebComponent` for reactive properties, declarative templates, and scoped styles.

### TypeScript configuration

Lit's `@customElement` and `@property` decorators need two compiler flags to work correctly. Add these to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "erasableSyntaxOnly": false
  }
}
```

`experimentalDecorators` enables the legacy decorator syntax Lit uses. `useDefineForClassFields: false` is the subtle one: when left at its ES2022 default (`true`), class field initializers run with `Object.defineProperty` and overwrite the reactive property accessors Lit installs, so `@property` values stop triggering re-renders. Setting it to `false` lets the decorators install accessors that the field initializers then assign through. `erasableSyntaxOnly` (TS 5.8+, on by default in some newer presets) disallows syntax with runtime effects, including decorators. If your preset enables it, turn it off for projects that use Lit.

If you target ES2022+ without these flags, Lit will appear to work until a `@property` value changes and nothing updates.

## Accessing Directives

### On a specific element

Every element with directives gets a typed `.directives` map. The return type is inferred from the class you pass in:

```ts
const highlight = el.directives?.get(Highlight);
// → Highlight | undefined
```

### With retry (async)

When a directive might not be mounted yet, `getDirective` polls until it appears:

```ts
const carousel = await Valet.getDirective(el, Carousel);
```

Defaults to 10 retries at 50ms intervals. Both are configurable:

```ts
const carousel = await Valet.getDirective(el, Carousel, 20, 100);
```

### All descendants

Returns a flat array of every directive instance within a subtree (excludes the root element):

```ts
const directives = Valet.getChildDirectives(wrapper);
```

## Events

A simple pub/sub system for decoupled communication between directives and components.

```ts
// Listen
Valet.on('cart:updated', (data) => {
  console.log('Cart changed:', data);
});

// Fire
Valet.emit('cart:updated', { items: 3, total: 29.99 });

// Unlisten (pass the same function reference)
Valet.off('cart:updated', handler);
```

Duplicate handlers are deduplicated. Emitting to an event with no listeners is a silent no-op.

## Development

```bash
npm run build        # ESM + CJS + .d.ts → dist/
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run dev          # Start demo on localhost:3000
```

## Contributing

1. Fork the repo and create a feature branch from `main`.
2. Run `npm install` to set up dependencies.
3. Make your changes — keep PRs focused on a single concern.
4. Add or update tests for any new behavior. Run `npm test` to make sure everything passes.
5. Run `npm run build` to verify the build succeeds.
6. Open a pull request with a clear description of what changed and why.

## License

MIT
