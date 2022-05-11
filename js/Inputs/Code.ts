import {
  Editor,
  EditorConfiguration,
  KeyMap,
  fromTextArea,
  EditorEventMap,
} from 'codemirror';
import Abstract from './Abstract';
import { Input } from '../Inputs';
import replaceBinaryBytes from '../replaceBinaryBytes';

export class Code extends Abstract implements Input {
  private editor: Editor;

  public constructor(parent: HTMLElement, options: EditorConfiguration = {}) {
    super();

    const element = this.createElement('div'),
      textarea = document.createElement('textarea') as HTMLTextAreaElement;

    parent.append(element);
    element.append(textarea);

    this.editor = fromTextArea(textarea, {
      mode: null,
      theme: 'monokai',
      viewportMargin: Infinity,
      ...options,
      extraKeys: {
        'Ctrl-D': 'duplicateLine',
        'Ctrl-/': 'toggleComment',
        'Shift-Tab': false,
        Tab: false,
        ...(Object.keys(options.extraKeys || {}).length
          ? (options.extraKeys as KeyMap)
          : {}),
      },
    });

    this.editor.on('change', () => {
      if (this.inputs === null) {
        return;
      }

      // Could be smarter about this...
      this.inputs.setBuffer(
        this.editor
          .getValue()
          .split('')
          .map((char) => char.charCodeAt(0))
      );
    });
  }

  public matches(data: string): boolean {
    return /^[\t\n -~]*$/.test(data);
  }

  public on(eventName: string, handler: (...args: any[]) => void): void {
    this.editor.on(eventName as keyof EditorEventMap, (...args: any[]) =>
      handler(...args)
    );
  }

  public readAsString(binaryReplacementChar: string | null = '.'): string {
    const code = unescape(encodeURIComponent(this.editor.getValue()));

    if (binaryReplacementChar === null) {
      return code;
    }

    return replaceBinaryBytes(code, binaryReplacementChar);
  }

  public reset(): void {
    this.editor.setValue('');
  }

  public setOption(
    key: keyof EditorConfiguration,
    value: EditorConfiguration[keyof EditorConfiguration]
  ): void {
    this.editor.setOption(key, value);
  }

  public setType(type: string | null): void {
    if (this.editor.getOption('mode') !== type) {
      this.editor.setOption('mode', type);
    }
  }

  public write(data: string | number[]): void {
    if (Array.isArray(data)) {
      // String.fromCharCode(...data) causes an error with really long input!
      data = data.map((c) => String.fromCharCode(c)).join('');
    }

    this.editor.setValue(data);
  }
}

export default Code;
