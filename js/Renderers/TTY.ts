import { ITerminalOptions, Terminal } from 'xterm';
import Abstract from './Abstract';
import { FitAddon } from 'xterm-addon-fit/src/FitAddon';
import { Renderer } from '../Renderers';

export class TTY extends Abstract implements Renderer {
  private buffer: string = '';
  private escapeInput: string = '';
  private fit: FitAddon;
  private maxX: number = 0;
  private maxY: number = 0;
  private options: ITerminalOptions;
  private terminal: Terminal;
  private x: number = 0;
  private y: number = 0;

  constructor(parent: HTMLElement, options: ITerminalOptions = {}) {
    super();

    this.container = this.createElement('div');
    this.container.classList.add('tty');

    parent.append(this.container);

    this.fit = new FitAddon();

    this.terminal = TTY.createTerminal(options);
    this.terminal.loadAddon(this.fit);
    this.terminal.open(this.container);

    this.options = options;
  }

  private static cleanText(text: string): string {
    // patch for xterm.js - this allows VT and FF but patches \n, vs. convertEol option
    return text.replace(/(?<!\r)\n/g, '\r\n');
  }

  private static createTerminal(options: ITerminalOptions = {}): Terminal {
    return new Terminal({
      disableStdin: true,
      screenReaderMode: true,
      ...options,
      theme: {
        background: '#272822',
        cursor: 'transparent',
        foreground: '#f8f8f2',
        ...(options.theme ?? {}),
      },
    });
  }

  private handleInputForSize(input: string): void {
    [input, this.escapeInput] = this.processInputForEscape(
      input,
      this.escapeInput
    );

    [this.x, this.y, this.maxX, this.maxY] = this.processInputForSize(
      this.x,
      this.y,
      this.maxX,
      this.maxY,
      input
    );
  }

  public matches(): boolean {
    return true;
  }

  private processInputForEscape(
    input: string,
    escapeInput: string = ''
  ): [string, string] {
    if (
      (escapeInput.length === 0 && input === '\x1b') ||
      (escapeInput.length === 1 && input === '[') ||
      (escapeInput && !input.match(/[\x40-\x7e]/))
    ) {
      return ['', escapeInput + input];
    }

    if (
      (this.escapeInput.length === 1 && input !== '[') ||
      (this.escapeInput && input.match(/[\x40-\x7e]/))
    ) {
      return [escapeInput + input, ''];
    }

    return [input, escapeInput];
  }

  private processInputForSize(
    x: number,
    y: number,
    maxX: number,
    maxY: number,
    input: string,
    cols: number = this.terminal.cols
  ): [number, number, number, number] {
    if (input.match(/\x1b\[(.*?)([\x40-\x7e])/)) {
      const [, value, type] = input.match(/\x1b\[(.*?)([\x40-\x7e])/);

      switch (type) {
        case 'F':
          x = 0;

        case 'A':
          y -= value ? parseInt(value, 10) || 1 : 1;
          break;

        case 'E':
          x = 0;

        case 'B':
          y += value ? parseInt(value, 10) || 1 : 1;
          break;

        case 'C':
          x += parseInt(value, 10) || 1;
          break;

        case 'D':
          x -= parseInt(value, 10) || 1;
          break;

        case 'G':
          x = parseInt(value, 10) || 1;
          break;

        case 'H':
        case 'f':
          [y, x] = /;/.test(value)
            ? value.split(/;/).map((value) => parseInt(value || '1', 10))
            : [parseInt(value, 10), 1];
          break;
      }

      if (x >= cols) {
        x = cols;
      }

      maxX = Math.max(x, maxX);
      maxY = Math.max(y, maxY);

      return [x, y, maxX, maxY];
    }

    switch (input) {
      case '\n':
        y++;
        x = 0;
        break;

      case '\f':
      case '\r':
      case '\v':
        y++;
        break;

      case '\t':
        x += x % 8 || 8;
        break;

      // backspace
      case '\x08':
        x--;
        break;

      default:
        x++;
    }

    if (x >= cols) {
      y++;
      x = 0;
    }

    maxX = Math.max(x, maxX);
    maxY = Math.max(y, maxY);

    return [x, y, maxX, maxY];
  }

  private reprocessBufferForSize(): number[] {
    let maxX = 0,
      maxY = 0,
      x = 0,
      y = 0,
      escapeInput = '';

    const results = this.buffer.match(/\x1b\[(.*?)([\x40-\x7e])|(.)/g);

    if (!results) {
      return [1, 1];
    }

    results.forEach((input) => {
      [input, escapeInput] = this.processInputForEscape(input, escapeInput);

      if (input) {
        [x, y, maxX, maxY] = this.processInputForSize(x, y, maxX, maxY, input);
      }
    });

    return [maxX + 1, maxY + 1];
  }

  public reset(): void {
    this.buffer = '';
    this.escapeInput = '';
    this.maxX = 0;
    this.maxY = 0;
    this.x = 0;
    this.y = 0;

    this.terminal.reset();
  }

  public resize(): void {
    if (
      this.container.hasAttribute('hidden') ||
      (this.options.cols && this.options.rows)
    ) {
      return;
    }

    const [, visibleLines] = this.reprocessBufferForSize(),
      dimensions = this.fit.proposeDimensions();

    this.terminal.resize(
      this.options.cols ?? dimensions?.cols ?? this.terminal.cols,
      this.options.rows ?? visibleLines
    );
  }

  public write(char: number): void;
  public write(data: string): void;
  public write(char: number | string): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.buffer += char;

    this.handleInputForSize(char);

    const rows = this.maxY + 1;

    if (rows !== this.terminal.rows) {
      this.terminal.resize(this.terminal.cols, rows);
    }

    this.terminal.write(TTY.cleanText(char));
  }
}

export default TTY;
