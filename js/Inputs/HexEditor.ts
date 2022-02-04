import Abstract from './Abstract';
import { Input } from '../Inputs';

export class HexEditor extends Abstract implements Input {
  private buffer: number[] = [];
  private editorContainer: HTMLDivElement;
  private gutter: HTMLTextAreaElement;
  private hexEditor: HTMLTextAreaElement;
  private textEditor: HTMLTextAreaElement;

  public constructor(parent: HTMLElement) {
    super();

    this.editorContainer = this.createElement('div') as HTMLDivElement;
    this.editorContainer.classList.add('hex-editor');

    this.gutter = document.createElement('textarea') as HTMLTextAreaElement;
    this.gutter.setAttribute('readonly', '');
    this.gutter.setAttribute('rows', '1');
    this.gutter.classList.add('gutter');
    this.hexEditor = document.createElement('textarea') as HTMLTextAreaElement;
    this.hexEditor.setAttribute('rows', '1');
    this.hexEditor.classList.add('hex-input');
    this.textEditor = document.createElement('textarea') as HTMLTextAreaElement;
    this.textEditor.setAttribute('cols', '15');
    this.textEditor.setAttribute('rows', '1');
    this.textEditor.classList.add('text-input');

    this.editorContainer.append(this.gutter, this.hexEditor, this.textEditor);

    parent.append(this.editorContainer);

    this.gutter.addEventListener('focus', () => this.hexEditor.focus());

    this.textEditor.addEventListener('keydown', (event) => {
      const { altKey, ctrlKey, metaKey, key } = event;

      if (
        /^[ -~]$/.test(key) &&
        [altKey, ctrlKey, metaKey].every((value) => value === false)
      ) {
        this.addValue(key, this.textEditor);

        event.preventDefault();

        return;
      }

      if (
        key === 'Tab' &&
        [altKey, ctrlKey, metaKey].every((value) => value === false)
      ) {
        this.addValue(9, this.textEditor);

        event.preventDefault();

        return;
      }

      if (
        key === 'Enter' &&
        [altKey, ctrlKey, metaKey].every((value) => value === false)
      ) {
        this.addValue(10, this.textEditor);

        event.preventDefault();

        return;
      }

      if (
        key === 'Delete' ||
        key === 'Backspace' ||
        (ctrlKey && (key === 'x' || key === 'X'))
      ) {
        // We'll have to try and reconstruct somehow...
        this.deleteTextValue(key === 'Backspace' ? -1 : 0);

        event.preventDefault();

        return;
      }

      if (key === 'Unidentified') {
        console.warn('Unidentified key pressed.');
      }
    });

    this.textEditor.addEventListener('paste', (event) => {
      this.addValue(event.clipboardData.getData('text/plain'), this.textEditor);

      event.preventDefault();
    });
  }

  private addValue(char: string | number, target: HTMLTextAreaElement): void {
    const chars: number[] = [];

    if (typeof char === 'string') {
      chars.push(...char.split('').map((char) => char.charCodeAt(0)));
    }

    if (typeof char === 'number') {
      chars.push(char);
    }

    this.deleteTextValue(0, chars);
  }

  private deleteTextValue(
    offset: number = -1,
    replacement: number[] = []
  ): void {
    const [start, end] = [
      this.textEditor.selectionStart,
      this.textEditor.selectionEnd,
    ];

    this.buffer.splice(start + offset, end - (start + offset), ...replacement);

    this.updateDisplay();

    this.textEditor.setSelectionRange(
      start + offset + replacement.length,
      start + offset + replacement.length,
      'forward'
    );
  }

  public matches(): boolean {
    return true;
  }

  public on(eventName: string, handler: (...args: any[]) => void): void {
    this.textEditor.addEventListener('change', (...args: any[]) =>
      handler(...args)
    );
  }

  public read(): number[] {
    return (
      this.hexEditor.value
        .replace(/\s+/g, '')
        .match(/[0-9a-f]{2}/g)
        ?.map((code) => parseInt(code, 16)) || []
    );
  }

  public readAsString(replaceBinaryBytes: string | null = '.'): string {
    const code = this.buffer.map((char) => String.fromCharCode(char)).join('');

    if (replaceBinaryBytes === null) {
      return code;
    }

    return code.replace(/[\x00-\x1f\x7f-\xff]/g, replaceBinaryBytes);
  }

  public reset(): void {
    this.buffer.splice(0);

    this.updateDisplay();
  }

  public setType(type: string | null): void {}

  public write(data: string | number[]): void {
    // TODO: Encode
  }

  private updateDisplay(): void {
    if (this.buffer.length === 0) {
      this.gutter.value = '';
      this.hexEditor.value = '';
      this.textEditor.value = '';

      this.gutter.rows = 1;
      this.hexEditor.rows = 1;
      this.textEditor.rows = 1;

      return;
    }

    const rows = Math.ceil((this.buffer.length + 1) / 16);

    this.gutter.value = Array(rows)
      .fill(0)
      .map((_, i) => (i + 1).toString(16).padStart(6, '0') + '0:')
      .join('\n');

    this.hexEditor.value = this.buffer
      .map((char) => char.toString(16).padStart(2, '0'))
      .join('')
      .replace(/[0-9a-f]{4}/gi, '$& ')
      .replace(/(([0-9a-f]{4} ){7}[0-9a-f]{4}) /gi, '$1\n');

    this.textEditor.value = this.readAsString();

    this.gutter.rows = rows;
    this.hexEditor.rows = rows;
    this.textEditor.rows = rows;
  }
}

export default HexEditor;
