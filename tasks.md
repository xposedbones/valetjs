# ValetJS — Demo & README Improvements

## Context

ValetJS is a lightweight directive and web component library. Its core differentiator vs. similar tools (Stimulus, Alpine, ModularJS) is that it uses **dynamic `import()` keyed on CSS selectors** to load component code only when matching elements are present on the page. Other tools gate *initialization* at runtime; ValetJS gates *loading* at the network level.

The current demo at `xposedbones.github.io/valetjs/` works but has a key weakness: it tells visitors to "open the Network tab" to see the lazy loading happen. That's friction, and mobile visitors can't do it at all. The goal of these tasks is to make the differentiator **visible on the page itself**, without requiring DevTools.

Priority order below is deliberate. Do tasks in order; each builds on the previous.

---

## Task 1: Rewrite the README opening paragraph

**File:** `README.md`

**Current opening:**

> Lightweight directive and web component lifecycle management for the DOM, powered by MutationObserver. Supports lazy-loading, typed directive access, and cross-component events.

**Replace with:**

> Most DOM frameworks ship every component's code in your bundle, then gate *initialization* on whether the element exists. ValetJS gates *loading* instead: components are fetched via dynamic imports only when their selector matches an element on the page. Directives for behavior, Lit for components, MutationObserver for dynamic content.
>
> [**See the live demo →**](https://xposedbones.github.io/valetjs/)

Keep everything else in the README the same for now.

---

## Task 2: Rewrite the demo page opening

**File:** wherever the demo page's intro copy lives (likely `demo/index.html` or similar).

**Current opening:**

> Lightweight directive and component lifecycle management for the DOM. Attach behavior to elements with directives, lazy-load anything, and communicate across components with a built-in event system — all driven by a single MutationObserver.

**Replace with something structurally equivalent to the new README opener**, adapted for a landing-page tone. Keep the dictionary-entry bit for "directive" that's already on the page — that's good and memorable, leave it alone.

---

## Task 3: Build a live "Network Activity" panel

This is the highest-value task. It makes the lazy loading visible without requiring DevTools.

**Goal:** A small, fixed-position panel (bottom-right corner, collapsible) that shows in real time which chunks have been loaded.

**Behavior:**

- On page load, show the core/eagerly-loaded chunks with their sizes.
- When a lazy loader fires (e.g. clicking "Spawn User Card"), a new row animates into the panel showing the chunk name, size, and a "just now" timestamp that fades to a relative time.
- Each row should show: chunk name, size in KB (transferred size preferred, fall back to decoded size), and when it loaded.
- Use a subtle highlight animation for newly added rows so visitors notice them.

**Implementation approach:**

- Wrap the lazy loader functions so each one reports to the panel when it fires. Example shape:
  ```ts
  const instrumentedLoader = (name: string, loader: () => Promise<any>) => () =>
    loader().then(mod => { reportLoad(name); return mod; });
  ```
- Use the Performance API (`performance.getEntriesByType('resource')`) to get actual transferred sizes where possible. Match by URL.
- For eagerly-loaded chunks, populate the panel on `DOMContentLoaded` by querying resource entries filtered to JS.
- Keep the panel component itself tiny and self-contained — it shouldn't itself be a big dependency.

**Style:**
- Match the existing demo aesthetic.
- Collapsible with a header like "Network Activity (3)" showing the count.
- Mobile-friendly: on small screens, it can collapse by default or sit at the bottom of the page rather than floating.

---

## Task 4: Add a bundle comparison section

**Goal:** Near the top of the demo page (after the intro paragraph, before the existing directive communication section), add a small section that shows the quantitative win.

**Content structure:**

- Heading like "What actually loaded"
- Three numbers, side by side or stacked on mobile:
  - **Total component code available:** sum of all chunks if eagerly bundled (compute this at build time, hardcode or inject as a constant).
  - **Loaded on this page:** dynamically computed from the resource entries at page load.
  - **After interactions:** updates as the visitor clicks Spawn, etc. Starts equal to "Loaded on this page" and increases.
- A one-liner under the numbers: "ValetJS only fetches the JavaScript for components that appear on the page."

**Implementation notes:**

- Build-time total: can be computed by a small build script that sums the output chunk sizes in `dist/` (or wherever the demo bundles land) and writes a constant to a generated file the demo imports.
- Runtime numbers: use the same resource-entry logic as the network panel; these two features can share a small utility module.

---

## Task 5: Show code snippets alongside each demo section

**Goal:** For each interactive section on the demo page (Directive Communication, Event System, Lazy-loaded Component, Native Web Component, Lit Web Component), show the relevant source code next to or below the live demo.

**Implementation:**

- Import the source files as raw strings (most bundlers support `?raw` imports, e.g. `import highlightSource from './directives/Highlight.ts?raw'`).
- Render in a syntax-highlighted code block. Use Shiki or Prism — Shiki preferred for quality, Prism if bundle size matters (it shouldn't for a demo page).
- Keep the snippet compact: the directive/component definition itself, not surrounding boilerplate.
- Layout: code on the right of the live demo on desktop, below on mobile.

---

## Task 6: Fill in or remove the empty sections

The current demo page has "Native Web Component" and "Lit Web Component" headings that appear to have little or no content under them.

**Either:**
- Add working, interactive examples under each (preferred), with source snippets per Task 5.
- Or remove the headings entirely.

Empty-looking sections weaken the demo's credibility for drive-by visitors.

---

## Task 7: Small polish items

These are quick wins; do them after the above are solid.

- Add a "Copy install command" button near the top of the demo page: `npm install valetjs lit`. One-click copy to clipboard with a brief "Copied!" feedback state.
- Add a footer with: npm version badge, GitHub link, MIT license, author credit.
- Verify the demo is mobile-friendly. Test at 375px width. The network panel and bundle comparison both need mobile variants.
- Add `<meta>` tags for social sharing (Open Graph title, description, a simple preview image). This matters when the library eventually gets shared on Bluesky, X, etc.

---

## Task 8: Add badges to the README

**File:** `README.md`, below the H1.

Add these badges in a single line:

- npm version (already present per the current README)
- Build status (GitHub Actions)
- Test coverage (Codecov or Coveralls — set up whichever if not already)
- Bundle size (bundlephobia or pkg-size)
- License (MIT)

Badges are cheap credibility. The 100% test coverage one is a real differentiator and should be visible.

---

## Nice-to-have (skip if short on time)

- A comparison table in the README: rows for ValetJS, Stimulus, Alpine, ModularJS. Columns for "dynamic import per component," "MutationObserver for new nodes," "TypeScript-first," "Lit integration." Keep it factual and non-snarky; note what each tool is good at.
- A `<details>` section in the README titled "Why another DOM library?" that briefly explains the wedge without dominating the top of the doc.

---

## Out of scope for this session

- Don't change the public API.
- Don't rename anything.
- Don't add new dependencies beyond what's needed for syntax highlighting (Shiki or Prism) and only if Task 5 needs it.
- Don't restructure the repo layout.

---

## Testing

After each task, verify:
- `npm test` still passes (100% coverage should remain 100%).
- `npm run build` produces working output.
- `npm run dev` serves the demo and everything still works.
- Spot-check in Chrome and Safari. Spot-check mobile layout at 375px.