import { Directive } from 'valetjs';

export default class Spawner extends Directive {
  static selector = '.spawner';
  private count = 0;

  onInit(): void {
    this.host.addEventListener('click', this.handleClick);
  }

  onDestroy(): void {
    this.host.removeEventListener('click', this.handleClick);
  }

  private handleClick = (): void => {
    this.count++;
    const tag = this.host.dataset.spawn || 'user-card';
    const el = document.createElement(tag);
    if (tag === 'user-card') {
      el.setAttribute('name', `User #${this.count}`);
    }

    const container = document.querySelector('#spawn-target');
    if (container) {
      container.appendChild(el);
    }
  };
}
