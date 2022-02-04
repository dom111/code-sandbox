export interface Renderer {
  activate(mimeType: string): void;
  deactivate(): void;
  isActive(): boolean;
  matches(mimeType: string): boolean;
  reset(): void;
  resize(): void;
  write(char: number | string): void;
}

export class Renderers {
  private buffer: string = '';
  private registered: Renderer[] = [];

  public constructor(...renderers: Renderer[]) {
    this.register(...renderers);
  }

  public activate(mimeType: string): void {
    this.registered.reduce((value, renderer): boolean => {
      // Activate the first Renderer that matches
      if (renderer.matches(mimeType) && !value) {
        if (!renderer.isActive()) {
          renderer.activate(mimeType);
          renderer.reset();
          renderer.write(this.buffer);
        }

        return true;
      }

      renderer.deactivate();
      renderer.reset();

      return value;
    }, false);

    this.resize();
  }

  public register(...renderers: Renderer[]): void {
    this.registered.push(...renderers);
  }

  public reset(): void {
    this.buffer = '';
    this.registered.forEach((renderer) => renderer.reset());
  }

  public resize(): void {
    this.registered.forEach((renderer) => {
      if (renderer.isActive()) {
        renderer.resize();
      }
    });
  }

  public write(char: number | string): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.buffer += char;
    this.registered
      .filter((renderer) => renderer.isActive())
      .forEach((renderer) => renderer.write(char));
  }
}

export default Renderers;

export const createDevice = (...renderers: Renderer[]): Renderers =>
  new Renderers(...renderers);
