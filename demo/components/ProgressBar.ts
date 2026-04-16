export default class ProgressBar extends HTMLElement {
  static observedAttributes = ['value'];

  private bar!: HTMLDivElement;

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; }
        .track { background: #e5e7eb; border-radius: 4px; height: 20px; overflow: hidden; }
        .bar { background: #8b5cf6; height: 100%; transition: width 0.3s ease; }
      </style>
      <div class="track"><div class="bar"></div></div>
    `;
    this.bar = shadow.querySelector('.bar')!;
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  private update() {
    if (!this.bar) return;
    const value = Number(this.getAttribute('value') || 0);
    this.bar.style.width = `${Math.min(100, Math.max(0, value))}%`;
  }
}

customElements.define('progress-bar', ProgressBar);
