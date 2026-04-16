import { Directive } from 'valetjs';

export default class Highlight extends Directive {
  static selector = '.highlight';

  onInit(): void {
    console.log('Init Highlight');
    this.host.classList.add('highlighted');
  }

  onDestroy(): void {
    console.log('Destroy Highlight');
  }

  toggle(): void {
    this.host.classList.toggle('highlighted');
  }
}
