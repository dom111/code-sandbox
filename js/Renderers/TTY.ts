import { ITerminalOptions, Terminal } from 'xterm';
import Abstract from './Abstract';
import { FitAddon } from 'xterm-addon-fit/src/FitAddon';
import { Renderer } from '../Renderers';

export class TTY extends Abstract implements Renderer {
  private fit: FitAddon;
  private terminal: Terminal;

  constructor(parent: HTMLElement, options: ITerminalOptions = {}) {
    super();

    this.container = this.createElement('div');
    this.container.classList.add('tty');

    parent.append(this.container);

    this.fit = new FitAddon();

    this.terminal = TTY.createTerminal(options);
    this.terminal.loadAddon(this.fit);
    this.terminal.open(this.container);
  }

  public matches(): boolean {
    return true;
  }

  public name(): string {
    return 'TTY';
  }

  public write(char: number): void;
  public write(data: string): void;
  public write(char: number | string): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.terminal.write(TTY.cleanText(char));
  }

  public reset(): void {
    this.terminal.reset();
  }

  public resize(): void {
    // TODO: Yeah... Not sure what's going on here, but this isn't good...
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.container.hasAttribute('hidden')) {
          return;
        }

        this.fit.activate(this.terminal);
        this.fit.fit(); // TODO: add in a limit for secondary elements like stderr
      });
    });
  }

  private static createTerminal(options: ITerminalOptions = {}): Terminal {
    return new Terminal({
      ...options,
      theme: {
        background: '#272822',
        cursor: 'transparent',
        foreground: '#f8f8f2',
        ...(options.theme ?? {}),
      },
    });
  }

  private static cleanText(text: string): string {
    // patch for xterm.js - this allows VT and FF but patches \n, vs. convertEol option
    return text.replace(/(?<!\r)\n/g, '\r\n');
  }
}

export default TTY;
