# ValetJS

[![npm version](https://img.shields.io/npm/v/valetjs.svg)](https://www.npmjs.com/package/valetjs)
[![CI](https://github.com/xposedbones/valetjs/actions/workflows/ci.yml/badge.svg)](https://github.com/xposedbones/valetjs/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/xposedbones/valetjs/branch/main/graph/badge.svg)](https://codecov.io/gh/xposedbones/valetjs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/valetjs)](https://bundlephobia.com/package/valetjs)
[![license](https://img.shields.io/npm/l/valetjs.svg)](https://github.com/xposedbones/valetjs/blob/main/LICENSE)

Lightweight directive and web component lifecycle management for the DOM, powered by MutationObserver. Supports lazy-loading, typed directive access, and cross-component events.

Most DOM frameworks ship every component's code in your bundle, then gate initialization on whether the element exists. ValetJS gates loading instead: components are fetched via dynamic imports only when their selector matches an element on the page. Directives for behavior, Lit for components, MutationObserver for dynamic content. [See it in action!](https://xposedbones.github.io/valetjs/)

<details>
<summary><strong>Why another DOM library?</strong></summary>

ValetJS isn't trying to replace your framework. It's a narrow tool for a specific problem: server-rendered pages where you want to sprinkle behavior onto HTML, but the list of "possible components" is big and most pages only use a handful of them.

The usual answer is a framework like Stimulus or Alpine: small, opt-in, attached to existing DOM. They work beautifully — but they still ship every component's code to every page, and only skip *initialization* when the element isn't there. ValetJS takes it one step further: if the selector doesn't match, the code never downloads in the first place. Same mental model, different network footprint.

**A concrete example.** Say your design system has 30 registered components — charts, modals, date pickers, carousels, rich editors, the works. A typical content page uses maybe 5 of them. With eager bundling, every visitor to every page pays for all 30. With ValetJS, they pay for 5. If each component is ~2 KB gzipped, that's ~50 KB of JavaScript your average visitor never downloads — on every page view, compounding across return visits.

The win scales with the *ratio* between the catalog size and per-page usage. Low-diversity pages don't benefit much. High-diversity design systems benefit a lot.

If you're already all-in on React/Vue/Svelte for an SPA, you don't need this. If you're writing mostly-HTML pages with bits of interactivity, this removes a chunk of the waste.

</details>

## How it compares

| | ValetJS | Stimulus | Alpine | ModularJS |
|---|---|---|---|---|
| Per-selector dynamic `import()` | ✅ | ❌ | ❌ | ❌ |
| MutationObserver for new nodes | ✅ | ✅ | ✅ | ❌ |
| TypeScript-first | ✅ | partial | ❌ | ❌ |
| Built-in Lit/Web Component support | ✅ | ❌ | ❌ | ❌ |
| Typed, async directive access | ✅ | ❌ | ❌ | ❌ |
| Cross-component event bus | ✅ | ❌ | ✅ (via `$dispatch`) | ❌ |

Stimulus and Alpine are excellent at what they do — a broader ecosystem, more battle-tested, nicer DX for inline-attribute authoring. ValetJS's one trick is that components cost nothing until they appear.

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
