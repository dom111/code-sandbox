import { ITerminalOptions, Terminal } from 'xterm';
import Abstract from './Abstract';
import { FitAddon } from 'xterm-addon-fit/src/FitAddon';
import { Renderer } from '../Renderers';
import Sequence from './TTY/Sequence';

interface ITTYOptions extends ITerminalOptions {
  autoGrow?: boolean;
  maxGrow?: number;
}

export class TTY extends Abstract implements Renderer {
  private buffer: string = '';
  private fit: FitAddon;
  private maxX: number = 0;
  private maxY: number = 0;
  private options: ITTYOptions;
  private partialSequence: string = '';
  private sequences: Sequence[] = [];
  private terminal: Terminal;
  private x: number = 0;
  private y: number = 0;

  public static defaultSequences: Sequence[] = [
    // OCI escape sequences
    new Sequence((input, x, y, cols) => {
      const [, value, type] = input.match(/^\x1b\[(.*?)([\x40-\x7e])$/);

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

      return [x, y];
    }, /\x1b\[.*?[\x40-\x7e]/),
    new Sequence(() => [0, 0], /\x1bc/),
    new Sequence((input, x, y) => {
      switch (input) {
        case '\n':
          y++;
          x = 0;
          break;

        case '\r':
          x = 0;
          break;

        case '\f':
        case '\v':
          y++;
          break;

        case '\t':
          x += x % 8 || 8;
          break;

        // backspace
        case '\x08':
          x--;
      }

      return [x, y];
    }, /\n|\r|\f|\v|\t|\x08/),
  ];

  constructor(
    parent: HTMLElement,
    options: ITTYOptions = {},
    sequences: Sequence[] = TTY.defaultSequences
  ) {
    super();

    this.container = this.createElement('div');
    this.container.classList.add('tty');

    parent.append(this.container);

    this.fit = new FitAddon();

    this.terminal = TTY.createTerminal(options);
    this.terminal.loadAddon(this.fit);
    this.terminal.open(this.container);

    this.options = options;
    this.sequences.push(...sequences);
  }

  private static cleanText(text: string): string {
    // patch for xterm.js - this allows VT and FF but patches \n, vs. convertEol option
    return text.replace(/(?<!\r)\n/g, '\r\n');
  }

  private static createTerminal(options: ITTYOptions = {}): Terminal {
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
    [input, this.partialSequence] = this.processInputForSequence(
      input,
      this.partialSequence
    );

    if (!input) {
      return;
    }

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

  private processInputForSequence(
    input: string,
    partialSequence: string = ''
  ): [string, string] {
    const combinedInput = partialSequence + input;

    if (partialSequence) {
      const [isPartialSequence, sequence] = this.sequences.reduce(
        (
          [finished, matchingSequence]: [boolean, Sequence | null],
          sequence
        ) => {
          if (finished) {
            return [finished, sequence];
          }

          if (sequence.matchesPartial(combinedInput)) {
            return [true, sequence];
          }

          return [false, null];
        },
        [false, null]
      );

      if (isPartialSequence && !sequence.matchesExact(combinedInput)) {
        return ['', combinedInput];
      }

      return [combinedInput, ''];
    }

    if (
      this.sequences.reduce(
        (finished, sequence) =>
          finished ||
          (sequence.matchesPartial(input) && !sequence.matchesExact(input)),
        false
      )
    ) {
      return ['', input];
    }

    return [combinedInput, ''];
  }

  private processInputForSize(
    x: number,
    y: number,
    maxX: number,
    maxY: number,
    input: string,
    cols: number = this.terminal.cols
  ): [number, number, number, number] {
    while (input.length) {
      let match: string;

      const result = this.sequences.reduce((finished, sequence) => {
        if (finished) {
          return finished;
        }

        if (sequence.matchesStart(input)) {
          [input, match] = sequence.capture(input);

          [x, y] = sequence.calculatePosition(match, x, y, cols);

          return true;
        }

        return false;
      }, false);

      if (!result) {
        input = input.slice(1);
        x++;
      }
    }

    while (x >= cols) {
      y++;
      x %= cols;
    }

    maxX = Math.max(x, maxX);
    maxY = Math.max(y, maxY);

    return [x, y, maxX, maxY];
  }

  private reprocessBufferForSize(): [number, number] {
    let maxX = 0,
      maxY = 0,
      x = 0,
      y = 0,
      partialSequence = '';

    Array.from(this.buffer).forEach((input) => {
      [input, partialSequence] = this.processInputForSequence(
        input,
        partialSequence
      );

      if (!input) {
        return;
      }

      [x, y, maxX, maxY] = this.processInputForSize(x, y, maxX, maxY, input);
    });

    return [maxX + 1, maxY + 1];
  }

  public reset(): void {
    this.buffer = '';
    this.partialSequence = '';
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

    console.log(this.options.rows ?? visibleLines);

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

    if (char.length > 1) {
      return Array.from(char).forEach((char) => this.write(char));
    }

    this.buffer += char;

    if (this.options.autoGrow) {
      this.handleInputForSize(char);

      const visibleLines = this.maxY + 1,
        rows = Math.min(
          Math.max(
            this.options.rows ?? 0,
            this.terminal.rows ?? 0,
            visibleLines
          ),
          this.options.maxGrow ?? Infinity
        );

      if (rows !== this.terminal.rows) {
        this.terminal.resize(this.terminal.cols, rows);
      }
    }

    this.terminal.write(TTY.cleanText(char));
  }
}

export default TTY;
