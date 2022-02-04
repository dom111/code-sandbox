import { Input, Inputs } from '../Inputs';

export abstract class Abstract implements Input {
  protected active: boolean = false;
  private container: HTMLElement;
  protected inputs: Inputs | null = null;

  public activate(inputs: Inputs): void {
    this.container.removeAttribute('hidden');
    this.active = true;
    this.inputs = inputs;

    this.resize();
  }

  protected createElement(tag: string = 'div'): HTMLElement {
    this.container = document.createElement(tag);

    this.container.setAttribute('hidden', '');

    return this.container;
  }

  public deactivate(): void {
    this.container.setAttribute('hidden', '');
    this.active = false;
  }

  public isActive(): boolean {
    return this.active;
  }

  abstract matches(data: string): boolean;

  abstract on(eventName: string, handler: (...args: any[]) => void): void;

  public read(): number[] {
    return this.readAsString(null)
      .split('')
      .map((c) => c.charCodeAt(0));
  }

  abstract readAsString(replaceBinaryBytes: string | null): string;

  abstract setType(type: string | null): void;

  abstract write(data: string | number[]): void;

  abstract reset(): void;

  public resize(): void {}
}

export default Abstract;
