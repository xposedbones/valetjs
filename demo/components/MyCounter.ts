import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { WebComponent } from 'valetjs';

@customElement('my-counter')
export default class MyCounter extends WebComponent {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin: 1rem 0;
    }
    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      cursor: pointer;
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
