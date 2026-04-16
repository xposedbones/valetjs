import { LitElement } from 'lit';
import { trackComponent, untrackComponent } from './Registry.js';

export class WebComponent extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    trackComponent(this);
    this.onInit();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    untrackComponent(this);
    this.onDestroy();
  }

  onInit(): void {}
  onDestroy(): void {}
}
