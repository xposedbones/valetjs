import { Directive, Valet } from 'valetjs';

class NotificationBanner extends Directive {
  static selector = '.notification-banner';

  onInit(): void {
    Valet.on('notification', this.handleNotification);
  }

  onDestroy(): void {
    Valet.off('notification', this.handleNotification);
  }

  private handleNotification = (data?: unknown): void => {
    const { message, time } = data as { message: string; time: string };
    this.host.textContent = `[${time}] ${message}`;
    this.host.style.display = 'block';
  };
}
