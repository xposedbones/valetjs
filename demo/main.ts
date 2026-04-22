import { Valet } from 'valetjs';
import { startMetrics } from './metrics.ts';
import { initPanel } from './panel.ts';

startMetrics();
initPanel();

import('./code.ts').then(m => m.mountCodeBlocks());

const copyBtn = document.querySelector<HTMLButtonElement>('.install-copy');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const cmd = copyBtn.dataset.installCmd || '';
    try {
      await navigator.clipboard.writeText(cmd);
      copyBtn.dataset.copied = 'true';
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        delete copyBtn.dataset.copied;
        copyBtn.textContent = 'Copy';
      }, 1600);
    } catch {
      copyBtn.textContent = 'Press ⌘C';
    }
  });
}

Valet.init({
  lazy: {
    '.highlight': () => import('./directives/Highlight.ts'),
    '.highlight-toggle': () => import('./directives/HighlightToggle.ts'),
    '.spawner': () => import('./directives/Spawner.ts'),
    '.notification-sender': () => import('./directives/NotificationSender.ts'),
    '.notification-banner': () => import('./directives/NotificationBanner.ts'),
    'user-card': () => import('./components/UserCard.ts'),
    'countdown-timer': () => import('./components/Countdown.ts'),
    'random-quote': () => import('./components/RandomQuote.ts'),
    'progress-bar': () => import('./components/ProgressBar.ts'),
    'my-counter': () => import('./components/MyCounter.ts'),
  },
});
