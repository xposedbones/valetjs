export default class ProgressBar extends HTMLElement {
  static observedAttributes = ['value'];
  static STEP = 10;

  private bar!: HTMLDivElement;
  private label!: HTMLSpanElement;

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; }
        .track { background: #e5e7eb; border-radius: 4px; height: 20px; overflow: hidden; }
        .bar { background: #8b5cf6; height: 100%; transition: width 0.3s ease; }
        .controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        button {
          padding: 0.25rem 0.6rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          color: #374151;
          line-height: 1;
        }
        button:hover { background: #f3f4f6; }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        .label {
          font-size: 0.85rem;
          color: #5c5f6a;
          font-variant-numeric: tabular-nums;
          min-width: 3ch;
        }
      </style>
      <div class="track"><div class="bar"></div></div>
      <div class="controls">
        <button type="button" data-dir="-1" aria-label="Decrease">−</button>
        <button type="button" data-dir="1" aria-label="Increase">+</button>
        <span class="label"></span>
      </div>
    `;
    this.bar = shadow.querySelector('.bar')!;
    this.label = shadow.querySelector('.label')!;

    shadow.querySelectorAll<HTMLButtonElement>('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.dir);
        this.nudge(dir * ProgressBar.STEP);
      });
    });

    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  private nudge(delta: number) {
    const current = this.clamp(Number(this.getAttribute('value') || 0));
    this.setAttribute('value', String(this.clamp(current + delta)));
  }

  private clamp(n: number) {
    return Math.min(100, Math.max(0, n));
  }

  private update() {
    if (!this.bar) return;
    const value = this.clamp(Number(this.getAttribute('value') || 0));
    this.bar.style.width = `${value}%`;
    this.label.textContent = `${value}%`;

    const buttons = this.shadowRoot!.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach((btn) => {
      const dir = Number(btn.dataset.dir);
      btn.disabled = (dir < 0 && value === 0) || (dir > 0 && value === 100);
    });
  }
}

customElements.define('progress-bar', ProgressBar);
