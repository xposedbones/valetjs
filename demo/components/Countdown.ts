import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { WebComponent } from 'valetjs';

@customElement('countdown-timer')
export default class Countdown extends WebComponent {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin: 0.5rem 0;
      background: #fef9f2;
      border-left: 4px solid #f59e0b;
      color: #92400e;
      font-variant-numeric: tabular-nums;
    }
    .count { font-size: 1.4rem; font-weight: 700; }
    .done { color: #059669; }
  `;

  @property({ type: Number }) count = 10;
  private timer?: number;

  onInit(): void {
    this.timer = window.setInterval(() => {
      this.count--;
      if (this.count <= 0) {
        window.clearInterval(this.timer);
        setTimeout(() => this.remove(), 800);
      }
    }, 1000);
  }

  onDestroy(): void {
    if (this.timer) window.clearInterval(this.timer);
    console.log('Bye from countdown');
  }

  render() {
    return this.count > 0
      ? html`<span class="count">${this.count}</span> seconds remaining`
      : html`<span class="count done">Done!</span>`;
  }
}
