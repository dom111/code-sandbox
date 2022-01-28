import { Renderer } from '../Renderers';

export abstract class Abstract implements Renderer {
  protected active: boolean = false;
  protected container: HTMLElement;
  protected mimeType: string = 'text/plain';

  public activate(mimeType: string): void {
    this.container.removeAttribute('hidden');
    this.active = true;
    this.mimeType = mimeType;

    this.resize();
  }

  protected createElement(tag: string = 'div'): HTMLElement {
    const element = document.createElement(tag);

    element.setAttribute('hidden', '');

    return element;
  }

  public deactivate(): void {
    this.container.setAttribute('hidden', '');
    this.active = false;
  }

  public isActive(): boolean {
    return this.active;
  }

  public matches(mimeType: string): boolean {
    return true;
  }

  abstract write(char: number): void;
  abstract write(data: string): void;

  abstract reset(): void;

  public resize(): void {}
}

export default Abstract;
