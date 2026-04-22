import { Directive, Valet } from 'valetjs';
import Highlight from './Highlight.js';

export default class HighlightToggle extends Directive {
  static selector = '.highlight-toggle';

  onInit(): void {
    this.host.addEventListener('click', this.handleClick);
  }

  onDestroy(): void {
    this.host.removeEventListener('click', this.handleClick);
  }

  private handleClick = async (): Promise<void> => {
    const target = this.host.dataset.target;
    if (!target) return;

    const el = document.querySelector(target);
    if (!el) return;

    const highlight = await Valet.getDirective<Highlight>(
      el,
      Highlight,
    );
    highlight.toggle();
  };
}
