import { getResources, subscribe, hasManifest, type ResourceEntry } from './metrics.ts';

let rowsEl: HTMLElement;
let countSub: HTMLElement;

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatRelative(at: number): string {
  const diff = performance.now() - at;
  if (diff < 1500) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  return `${Math.floor(diff / 60_000)}m ago`;
}

function render() {
  const entries = getResources();
  countSub.textContent = `${entries.length}`;
  rowsEl.textContent = '';
  for (const e of entries) {
    rowsEl.appendChild(buildRow(e));
  }
}

function buildRow(e: ResourceEntry): HTMLElement {
  const row = document.createElement('div');
  row.className = 'valet-panel-row';
  if (performance.now() - e.at < 2000) row.classList.add('is-new');

  const nameEl = document.createElement('span');
  nameEl.className = 'valet-panel-name';
  nameEl.title = e.url;
  nameEl.textContent = e.name;

  const sizeEl = document.createElement('span');
  sizeEl.className = `valet-panel-size valet-panel-size--${e.sizeKind}`;
  sizeEl.textContent = formatBytes(e.bytes);
  sizeEl.title = e.sizeKind === 'gzip' ? 'gzipped' : e.sizeKind === 'wire' ? 'on-wire' : 'uncompressed';

  const timeEl = document.createElement('span');
  timeEl.className = 'valet-panel-time';
  timeEl.textContent = formatRelative(e.at);

  row.append(nameEl, sizeEl, timeEl);
  return row;
}

function mount() {
  const host = document.createElement('aside');
  host.className = 'valet-panel';
  host.dataset.collapsed = 'false';

  const style = document.createElement('style');
  style.textContent = `
    .valet-panel {
      position: fixed; bottom: 1rem; right: 1rem; width: 320px; max-width: calc(100vw - 2rem);
      background: #1a1a2e; color: #e7e9f0;
      border: 1px solid #2a2a42; border-radius: 8px;
      font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
      z-index: 9999; overflow: hidden;
    }
    .valet-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: .5rem; padding: .55rem .75rem; cursor: pointer; user-select: none;
      background: #141428; border-bottom: 1px solid #2a2a42;
    }
    .valet-panel-title { display: flex; align-items: center; gap: .5rem; }
    .valet-panel-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; box-shadow: 0 0 6px #34d399; }
    .valet-panel-label { font-weight: 600; letter-spacing: .02em; }
    .valet-panel-count {
      background: #2a2a42; color: #a5b4fc; padding: 1px 7px; border-radius: 999px; font-size: 11px;
    }
    .valet-panel-caret { color: #8b8d97; transition: transform .2s; }
    .valet-panel[data-collapsed="true"] .valet-panel-caret { transform: rotate(-90deg); }
    .valet-panel[data-collapsed="true"] .valet-panel-header { border-bottom: none; }
    .valet-panel-body { max-height: 45vh; overflow-y: auto; }
    .valet-panel[data-collapsed="true"] .valet-panel-body { display: none; }
    .valet-panel-body::-webkit-scrollbar { width: 6px; }
    .valet-panel-body::-webkit-scrollbar-thumb { background: #2a2a42; border-radius: 3px; }
    .valet-panel-row {
      display: grid; grid-template-columns: 1fr auto auto; gap: .6rem;
      padding: .4rem .75rem; align-items: center; border-top: 1px solid #22223a;
    }
    .valet-panel-row:first-child { border-top: none; }
    .valet-panel-row.is-new { animation: valetPulse 1.6s ease-out; }
    @keyframes valetPulse {
      0%   { background: rgba(253, 230, 138, .35); }
      100% { background: transparent; }
    }
    .valet-panel-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .valet-panel-size { color: #a1a4b3; font-variant-numeric: tabular-nums; }
    .valet-panel-size--raw::after { content: '·raw'; margin-left: 4px; color: #6b6e7b; font-size: 10px; }
    .valet-panel-time { color: #8b8eff; font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .valet-panel-footer {
      padding: .4rem .75rem; background: #141428; border-top: 1px solid #2a2a42;
      color: #f59e0b; font-size: 10.5px; letter-spacing: .02em;
    }
    @media (max-width: 560px) {
      .valet-panel { left: .5rem; right: .5rem; bottom: .5rem; width: auto; }
      .valet-panel-body { max-height: 35vh; }
    }
  `;

  const header = document.createElement('div');
  header.className = 'valet-panel-header';
  const title = document.createElement('div');
  title.className = 'valet-panel-title';
  const dot = document.createElement('span');
  dot.className = 'valet-panel-dot';
  const labelEl = document.createElement('span');
  labelEl.className = 'valet-panel-label';
  labelEl.textContent = 'Network Activity';
  countSub = document.createElement('span');
  countSub.className = 'valet-panel-count';
  countSub.textContent = '0';
  title.append(dot, labelEl, countSub);
  const caret = document.createElement('span');
  caret.className = 'valet-panel-caret';
  caret.textContent = '▾';
  header.append(title, caret);

  rowsEl = document.createElement('div');
  rowsEl.className = 'valet-panel-body';

  host.append(style, header, rowsEl);

  if (!hasManifest()) {
    const footer = document.createElement('div');
    footer.className = 'valet-panel-footer';
    footer.textContent = 'Dev mode — sizes include Vite transform overhead (prod is ~5x smaller gzipped)';
    host.append(footer);
  }

  header.addEventListener('click', () => {
    host.dataset.collapsed = host.dataset.collapsed === 'true' ? 'false' : 'true';
  });

  if (window.matchMedia('(max-width: 560px)').matches) {
    host.dataset.collapsed = 'true';
  }

  document.body.appendChild(host);
}

export async function initPanel() {
  if (!document.body) {
    await new Promise<void>(resolve =>
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
    );
  }
  mount();
  subscribe(render);
  render();
  setInterval(render, 1000);
}
