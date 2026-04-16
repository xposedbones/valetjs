import { LitElement } from 'lit';

const COMPONENT_ATTR = 'valet-component';

export class WebComponent extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute(COMPONENT_ATTR, '');
    this.onInit();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeAttribute(COMPONENT_ATTR);
    this.onDestroy();
  }

  onInit(): void {}
  onDestroy(): void {}
}
