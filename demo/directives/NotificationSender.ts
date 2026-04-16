import { Directive, Valet } from 'valetjs';

export default class NotificationSender extends Directive {
  static selector = '.notification-sender';

  onInit(): void {
    this.host.addEventListener('click', this.handleClick);
  }

  onDestroy(): void {
    this.host.removeEventListener('click', this.handleClick);
  }

  private handleClick = (): void => {
    const message = this.host.dataset.message || 'Hello from Valet!';
    Valet.emit('notification', { message, time: new Date().toLocaleTimeString() });
  };
}
