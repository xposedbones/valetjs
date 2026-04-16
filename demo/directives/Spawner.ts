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
    const card = document.createElement('user-card');
    card.setAttribute('name', `User #${this.count}`);

    const container = document.querySelector('#spawn-target');
    if (container) {
      container.appendChild(card);
    }
  };
}
