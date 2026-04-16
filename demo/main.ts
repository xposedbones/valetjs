import { Valet } from 'valetjs';

Valet.init({
  lazy: {
    '.highlight': import('./directives/Highlight.ts'),
    '.highlight-toggle': import('./directives/HighlightToggle.ts'),
    '.spawner': import('./directives/Spawner.ts'),
    '.notification-sender': import('./directives/NotificationSender.ts'),
    '.notification-banner': import('./directives/NotificationBanner.ts'),
    'user-card': import('./components/UserCard.ts'),
    'progress-bar': import('./components/ProgressBar.ts'),
    'my-counter': import('./components/MyCounter.ts'),
  },
});
