export type ChunkSize = { gzip: number; raw: number; dynamic: boolean };
export type ResourceEntry = {
  url: string;
  name: string;
  bytes: number;
  sizeKind: 'gzip' | 'wire' | 'raw';
  at: number;
};

let manifest: Record<string, ChunkSize> | null = null;
const resources: ResourceEntry[] = [];
const seen = new Set<string>();
const subscribers = new Set<() => void>();

function loadManifest() {
  const el = document.getElementById('chunk-sizes');
  if (!el?.textContent) return;
  try {
    manifest = JSON.parse(el.textContent);
  } catch {
    // malformed manifest; stay in fallback mode
  }
}

const RELEVANT_STEMS = new Set([
  'Highlight', 'HighlightToggle', 'Spawner',
  'NotificationSender', 'NotificationBanner',
  'UserCard', 'Countdown', 'RandomQuote',
  'ProgressBar', 'MyCounter',
  'index', 'property',
]);

function stemFromPath(path: string): string {
  const filename = path.split('/').pop() || '';
  return filename
    .replace(/-[A-Za-z0-9_-]{8,}\.js$/, '')
    .replace(/\.(js|mjs|ts|tsx)$/, '');
}

function isRelevantStem(stem: string): boolean {
  if (RELEVANT_STEMS.has(stem)) return true;
  return /^lit\b|^@lit\b|^lit-/.test(stem);
}

function isRelevantResource(url: string): boolean {
  try {
    const u = new URL(url, document.baseURI);
    if (u.searchParams.has('raw')) return false;
    const pathname = u.pathname;
    if (!/\.(js|mjs|ts|tsx)$/.test(pathname)) return false;

    if (pathname.includes('/src/')) return true;
    if (pathname.includes('/demo/directives/')) return true;
    if (pathname.includes('/demo/components/')) return true;
    if (/\/(lit|@lit)[-.\/]/.test(pathname)) return true;

    return isRelevantStem(stemFromPath(pathname));
  } catch {
    return false;
  }
}

function deriveName(url: string): string {
  try {
    const u = new URL(url, document.baseURI);
    const last = u.pathname.split('/').pop() || url;
    return last.replace(/-[A-Za-z0-9_-]{8,}(\.js)$/, '$1');
  } catch {
    return url;
  }
}

function resolveSize(entry: PerformanceResourceTiming): { bytes: number; kind: ResourceEntry['sizeKind'] } {
  if (manifest) {
    const pathname = new URL(entry.name, document.baseURI).pathname;
    const key = pathname.replace(/^.*?\/assets\//, 'assets/');
    const hit = manifest[key];
    if (hit) return { bytes: hit.gzip, kind: 'gzip' };
  }
  if (entry.transferSize && entry.transferSize > 0) {
    return { bytes: entry.transferSize, kind: 'wire' };
  }
  if (entry.encodedBodySize > 0) {
    return { bytes: entry.encodedBodySize, kind: 'wire' };
  }
  return { bytes: entry.decodedBodySize || 0, kind: 'raw' };
}

function addResource(entry: PerformanceResourceTiming) {
  if (!isRelevantResource(entry.name)) return;
  if (seen.has(entry.name)) return;
  seen.add(entry.name);
  const { bytes, kind } = resolveSize(entry);
  resources.push({
    url: entry.name,
    name: deriveName(entry.name),
    bytes,
    sizeKind: kind,
    at: performance.now(),
  });
  notify();
}

function notify() {
  for (const fn of subscribers) fn();
}

function getResources(): ReadonlyArray<ResourceEntry> {
  return resources;
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

function hasManifest(): boolean {
  return manifest !== null;
}

function startMetrics() {
  loadManifest();

  for (const e of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    addResource(e);
  }

  const observer = new PerformanceObserver((list) => {
    for (const e of list.getEntries() as PerformanceResourceTiming[]) addResource(e);
  });
  observer.observe({ type: 'resource', buffered: true });
}
