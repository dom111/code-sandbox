import Abstract from './Abstract';
import { Input } from '../Inputs';

type SelectionDetails = [number, number];
type UndoStackEntry = {
  delete: boolean;
  redo: () => void;
  simple: boolean;
  undo: () => void;
};

export type HexEditorOptions = {
  combineSimpleUndo?: boolean;
  maxUndoLevel?: number;
};

export class HexEditor extends Abstract implements Input {
  private buffer: number[] = [];
  private editorContainer: HTMLDivElement;
  private gutter: HTMLTextAreaElement;
  private hexEditor: HTMLTextAreaElement;
  private options: HexEditorOptions = {};
  private textEditor: HTMLTextAreaElement;
  private undoBuffer: UndoStackEntry[] = [];
  private undoPosition: number = 0;

  public constructor(parent: HTMLElement, options: HexEditorOptions = {}) {
    super();

    this.options = {
      combineSimpleUndo: true,
      maxUndoLevel: 100,
      ...options,
    };

    this.editorContainer = this.createElement('div') as HTMLDivElement;
    this.editorContainer.setAttribute('tabindex', '-1');
    this.editorContainer.classList.add('hex-editor');

    this.gutter = document.createElement('textarea') as HTMLTextAreaElement;
    this.gutter.setAttribute('readonly', '');
    this.gutter.setAttribute('rows', '1');
    this.gutter.setAttribute('spellcheck', 'false');
    this.gutter.classList.add('gutter');
    this.hexEditor = document.createElement('textarea') as HTMLTextAreaElement;
    this.hexEditor.setAttribute('rows', '1');
    this.hexEditor.setAttribute('spellcheck', 'false');
    this.hexEditor.classList.add('hex-input');
    this.textEditor = document.createElement('textarea') as HTMLTextAreaElement;
    this.textEditor.setAttribute('cols', '15');
    this.textEditor.setAttribute('rows', '1');
    this.textEditor.setAttribute('spellcheck', 'false');
    this.textEditor.classList.add('text-input');

    this.editorContainer.append(this.gutter, this.hexEditor, this.textEditor);

    parent.append(this.editorContainer);

    this.editorContainer.addEventListener('click', ({ target }) => {
      if (target === this.hexEditor || target === this.gutter) {
        this.hexEditor.focus();

        return;
      }

      this.textEditor.focus();
    });

    this.textEditor.addEventListener('keydown', (event) => {
      const { altKey, ctrlKey, metaKey, key } = event;

      if (
        /^[ -~]$/.test(key) &&
        [altKey, ctrlKey, metaKey].every((value) => value === false)
      ) {
        this.addValue(key);

        event.preventDefault();

        return;
      }

      if (
        key === 'Tab' &&
        [altKey, ctrlKey, metaKey].every((value) => value === false)
      ) {
        this.addValue(9);

        event.preventDefault();

        return;
      }

      if (
        key === 'Enter' &&
        [altKey, ctrlKey, metaKey].every((value) => value === false)
      ) {
        this.addValue(10);

        event.preventDefault();

        return;
      }

      if (
        (key === 'Delete' && !ctrlKey) ||
        (key === 'Backspace' && !ctrlKey) ||
        (ctrlKey && (key === 'x' || key === 'X'))
      ) {
        // We'll have to try and reconstruct somehow...
        const [start, end] = this.currentSelection();

        this.spliceBuffer(
          [],
          start === end
            ? key === 'Backspace'
              ? [start - 1, start]
              : [start, start + 1]
            : [start, end]
        );

        this.setSelection(this.textEditor, start);

        event.preventDefault();

        return;
      }

      if ((key === 'Delete' || key === 'Backspace') && ctrlKey) {
        const [start] = this.currentSelection();

        this.deleteWord(key === 'Delete' ? 'forward' : 'backward');

        this.setSelection(this.textEditor, start);

        event.preventDefault();

        return;
      }

      if (ctrlKey && key === 'z') {
        this.performUndo();

        event.preventDefault();

        return;
      }

      if (ctrlKey && (key === 'Z' || key === 'y' || key === 'Y')) {
        this.performRedo();

        event.preventDefault();

        return;
      }

      if (key === 'Unidentified') {
        console.warn('Unidentified key pressed.');
      }
    });

    this.textEditor.addEventListener('paste', (event) => {
      this.addValue(event.clipboardData.getData('text/plain'));

      event.preventDefault();
    });

    // TODO: debounce?
    [this.gutter, this.hexEditor, this.textEditor].forEach((target) =>
      target.addEventListener('scroll', () =>
        [this.gutter, this.hexEditor, this.textEditor].forEach((element) => {
          if (element === target) {
            return;
          }

          element.scrollTop = target.scrollTop;
        })
      )
    );
  }

  private addUndo({
    delete: isDelete,
    redo,
    simple,
    undo,
  }: UndoStackEntry): void {
    if (this.undoPosition < this.undoBuffer.length) {
      this.undoBuffer.splice(
        this.undoPosition,
        this.undoBuffer.length - this.undoPosition
      );
    }

    if (this.undoBuffer.length >= this.options.maxUndoLevel) {
      this.undoBuffer.shift();
      this.undoPosition--;
    }

    const previous =
      this.undoPosition > 0 ? this.undoBuffer[this.undoPosition - 1] : null;

    if (
      this.undoPosition === 0 ||
      !this.options.combineSimpleUndo ||
      !simple ||
      !previous ||
      !previous.simple ||
      !previous.delete === isDelete
    ) {
      this.undoBuffer.push({ delete: isDelete, redo, simple, undo });
      this.undoPosition++;

      return;
    }

    const { undo: previousUndo, redo: previousRedo } = this.undoBuffer.pop();

    this.undoBuffer.push({
      delete: isDelete,
      redo: () => {
        previousRedo();
        redo();
      },
      simple,
      undo: () => {
        undo();
        previousUndo();
      },
    });
  }

  private addValue(char: string | number): void {
    const chars: number[] = [];

    if (typeof char === 'string') {
      chars.push(...char.split('').map((char) => char.charCodeAt(0)));
    }

    if (typeof char === 'number') {
      chars.push(char);
    }

    this.spliceBuffer(chars);
  }

  private currentSelection(): SelectionDetails {
    const active = document.activeElement as HTMLTextAreaElement;

    if (![this.hexEditor, this.textEditor].includes(active)) {
      return [-1, -1];
    }

    const isTextArea = active instanceof HTMLTextAreaElement,
      selection = getSelection(),
      range = selection.getRangeAt(0);

    const start = isTextArea ? active.selectionStart : range.startOffset,
      end = isTextArea ? active.selectionEnd : range.endOffset;

    return [start < end ? start : end, start < end ? end : start];
  }

  private deleteWord(direction: 'forward' | 'backward'): void {
    const [start, end] = this.currentSelection();

    if (start === -1 || end === -1) {
      return;
    }

    if (start !== end) {
      this.spliceBuffer([], start < end ? [start, end] : [end, start]);

      return;
    }

    const wordChars = [
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 71, 72,
        73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90,
        95, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
        111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
      ],
      step = direction === 'forward' ? 1 : -1,
      initial = start + (direction === 'forward' ? 0 : -1),
      initialChar = this.buffer[initial],
      initialIsWordChar = wordChars.includes(initialChar);

    let target = initial;

    for (let i = target; i >= 0 && i < this.buffer.length; i += step) {
      const currentChar = this.buffer[i],
        currentIsWordChar = wordChars.includes(currentChar);

      if (
        (initialIsWordChar && !currentIsWordChar) ||
        (!initialIsWordChar && initialChar !== currentChar)
      ) {
        break;
      }

      target = i + (direction === 'forward' ? 1 : 0);
    }

    this.spliceBuffer([], start < target ? [start, target] : [target, start]);
  }

  public matches(): boolean {
    return true;
  }

  public on(eventName: string, handler: (...args: any[]) => void): void {
    this.textEditor.addEventListener(eventName, (...args: any[]) =>
      handler(...args)
    );
  }

  private performRedo(): void {
    if (this.undoPosition >= this.undoBuffer.length) {
      return;
    }

    this.undoBuffer[this.undoPosition].redo();
    this.undoPosition++;

    this.updateDisplay();
  }

  private performUndo(): void {
    if (this.undoPosition < 1) {
      return;
    }

    this.undoPosition--;
    this.undoBuffer[this.undoPosition].undo();

    this.updateDisplay();
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

  private setSelection(target, start): void {
    target.setSelectionRange(start, start, 'forward');
  }

  public setType(type: string | null): void {}

  private spliceBuffer(
    replacement: number[] = [],
    range: SelectionDetails = this.currentSelection()
  ): void {
    const [start, end] = range,
      deletedChars = this.buffer.slice(start, end);

    if (
      start === -1 ||
      end === -1 ||
      start > this.buffer.length ||
      (deletedChars.length === 0 && replacement.length === 0)
    ) {
      return;
    }

    this.buffer.splice(start, end - start, ...replacement);

    const redo = () => this.buffer.splice(start, end - start, ...replacement),
      undo = () =>
        this.buffer.splice(start, replacement.length, ...deletedChars);

    this.addUndo({
      delete: replacement.length === 0,
      redo,
      simple:
        (start === end && replacement.length === 1) ||
        (Math.abs(start - end) === 1 && replacement.length === 0),
      undo,
    });

    this.updateDisplay();
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

  public write(data: string | number[]): void {
    // TODO: Encode
  }
}

export default HexEditor;
