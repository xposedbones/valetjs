import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { WebComponent } from 'valetjs';

@customElement('my-counter')
class MyCounter extends WebComponent {
  static styles = css`
    :host { display: block; }
    button {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      cursor: pointer;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      margin-top: 0.5rem;
    }
  `;

  @property({ type: Number }) count = 0;

  render() {
    return html`
      <p>Count: <strong>${this.count}</strong></p>
      <button @click=${() => this.count++}>Increment</button>
      <button @click=${() => this.count--}>Decrement</button>
    `;
  }
}
