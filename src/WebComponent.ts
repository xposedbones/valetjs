import { LitElement } from 'lit';

export class WebComponent extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    this.onInit();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.onDestroy();
  }

  onInit(): void {}
  onDestroy(): void {}
}
