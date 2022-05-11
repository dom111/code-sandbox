import Abstract from './Abstract';
import { Renderer } from '../Renderers';

export class IFrame extends Abstract implements Renderer {
  protected buffer: string = '';
  protected container: HTMLIFrameElement;
  protected mimeType: string = 'text/html';

  public constructor(parent: HTMLElement) {
    super();

    this.container = this.createElement('iframe');

    parent.append(this.container);

    this.update();
  }

  public activate(mimeType: string) {
    super.activate(mimeType);

    this.update();
  }

  public matches(mimeType: string): boolean {
    return ['text/html'].includes(mimeType);
  }

  public reset(): void {
    this.buffer = '';
    this.update();
  }

  public write(char: number): void;
  public write(data: string): void;
  public write(char: number | string): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.buffer += char;
    this.update();
  }

  private update(): void {
    // We need to destroy and recreate the IFrame so that we don't clobber the back button.
    const container = this.createElement(
      'iframe',
      this.container.hasAttribute('hidden')
    );

    container.src = `data:${this.mimeType};base64,${btoa(this.buffer)}`;

    this.container.replaceWith(container);

    this.container = container;
  }
}

export default IFrame;
