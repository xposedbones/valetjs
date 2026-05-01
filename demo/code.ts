import HighlightToggleSrc from './directives/HighlightToggle.ts?raw';
import NotificationSenderSrc from './directives/NotificationSender.ts?raw';
import NotificationBannerSrc from './directives/NotificationBanner.ts?raw';
import UserCardSrc from './components/UserCard.ts?raw';
import CountdownSrc from './components/Countdown.ts?raw';
import RandomQuoteSrc from './components/RandomQuote.ts?raw';
import ProgressBarSrc from './components/ProgressBar.ts?raw';
import MyCounterSrc from './components/MyCounter.ts?raw';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import theme from 'shiki/themes/github-dark-dimmed.mjs';
import lang from 'shiki/langs/typescript.mjs';

const sources: Record<string, string> = {
  'HighlightToggle.ts': HighlightToggleSrc,
  'NotificationSender.ts': NotificationSenderSrc,
  'NotificationBanner.ts': NotificationBannerSrc,
  'UserCard.ts': UserCardSrc,
  'Countdown.ts': CountdownSrc,
  'RandomQuote.ts': RandomQuoteSrc,
  'ProgressBar.ts': ProgressBarSrc,
  'MyCounter.ts': MyCounterSrc,
};

function ensureStyles() {
  if (document.getElementById('valet-code-style')) return;
  const style = document.createElement('style');
  style.id = 'valet-code-style';
  style.textContent = `
    details.source {
      margin-top: 1rem;
      border: 1px solid #e2e4e9;
      border-radius: 6px;
      background: #fafbfd;
    }
    details.source[open] { background: #f8f9fb; }
    details.source summary {
      cursor: pointer;
      padding: .55rem .85rem;
      font-size: 0.78rem;
      color: #5c5f6a;
      font-weight: 500;
      letter-spacing: .02em;
      list-style: none;
      display: flex;
      align-items: center;
      gap: .5rem;
      user-select: none;
    }
    details.source summary::-webkit-details-marker { display: none; }
    details.source summary::before {
      content: '▸';
      color: #8b8d97;
      font-size: 0.7rem;
      transition: transform .15s ease;
      display: inline-block;
    }
    details.source[open] summary::before { transform: rotate(90deg); }
    details.source summary:hover { color: #1a1a2e; }
    details.source > *:not(summary) { padding: 0 .85rem .85rem; }
    details.source .code-wrapper {
      border-radius: 6px; overflow: hidden;
      border: 1px solid #2a2a42; background: #22272e;
    }
    details.source .code-header {
      background: #141428; color: #a5b4fc; padding: .35rem .75rem;
      font: 600 10.5px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      letter-spacing: .05em; text-transform: uppercase;
    }
    details.source .code-body pre {
      margin: 0; padding: .75rem;
      font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow: auto; max-height: 420px;
    }
    details.source .code-body pre::-webkit-scrollbar { width: 6px; height: 6px; }
    details.source .code-body pre::-webkit-scrollbar-thumb { background: #2a2a42; border-radius: 3px; }
    details.source .code-body pre code { background: transparent; padding: 0; }
  `;
  document.head.appendChild(style);
}

async function mountCodeBlocks() {
  ensureStyles();
  const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-code]'));
  if (blocks.length === 0) return;

  const highlighter = await createHighlighterCore({
    themes: [theme],
    langs: [lang],
    engine: createJavaScriptRegexEngine(),
  });

  for (const block of blocks) {
    const name = block.getAttribute('data-code')!;
    const src = sources[name];
    if (!src) continue;

    const html = highlighter.codeToHtml(src, {
      lang: 'typescript',
      theme: 'github-dark-dimmed',
    });

    block.textContent = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    const header = document.createElement('div');
    header.className = 'code-header';
    header.textContent = name;
    const body = document.createElement('div');
    body.className = 'code-body';
    body.innerHTML = html;
    wrapper.append(header, body);
    block.appendChild(wrapper);
  }
}
