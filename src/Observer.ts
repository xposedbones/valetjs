import { scanDirectives, destroyDirectivesIn } from './Scanner.js';
import { checkLazy } from './Lazy.js';

let observer: MutationObserver | null = null;

function handleMutations(mutations: MutationRecord[]): void {
  const added: Element[] = [];
  const removed: Element[] = [];

  for (const { addedNodes, removedNodes } of mutations) {
    for (const node of addedNodes) {
      if (node.nodeType === 1) added.push(node as Element);
    }
    for (const node of removedNodes) {
      if (node.nodeType === 1) removed.push(node as Element);
    }
  }

  for (const node of removed) {
    destroyDirectivesIn(node);
  }
  for (const node of added) {
    checkLazy(node);
    scanDirectives(node);
  }
}

export function startObserver(root: Element = document.body): void {
  if (observer) {
    observer.disconnect();
  }
  observer = new MutationObserver(handleMutations);
  observer.observe(root, { childList: true, subtree: true });
}

export function stopObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
