import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { WebComponent } from 'valetjs';

@customElement('user-card')
export default class UserCard extends WebComponent {
  static styles = css`
    :host {
      display: block;
      padding: .5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin: 0.5rem 0;
      background: #f0fdf4;
      border-left: 4px solid #22c55e;

      p {
        margin: 0;
      }
    }
  `;

  @property() name = 'Anonymous';

  onInit(): void {
    console.log(`UserCard initialized: ${this.name}`);
  }

  render() {
    return html`<p>User: <strong>${this.name}</strong></p>`;
  }
}
