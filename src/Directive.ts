export class Directive<T extends HTMLElement = HTMLElement> {
  public static selector = '';
  public host!: T;

  onInit(): void {}
  onDestroy(): void {}
}
