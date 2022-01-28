import { Editor, EditorConfiguration } from 'codemirror';
import Abstract from './Abstract';
import { Renderer } from '../Renderers';
import UI from '../UI';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/perl/perl';

export class Code extends Abstract implements Renderer {
  private editor: Editor;

  constructor(parent: HTMLElement, options: EditorConfiguration = {}) {
    super();

    const textarea = document.createElement('textarea');

    this.container = this.createElement('div');

    this.container.append(textarea);
    parent.append(this.container);

    this.editor = UI.createEditor(textarea, {
      ...options,
      readOnly: true,
    });

    parent.append(this.container);
  }

  activate(mimeType: string) {
    super.activate(mimeType);

    this.editor.setOption('mode', mimeType);
  }

  deactivate() {
    super.deactivate();
  }

  matches(mimeType: string): boolean {
    return [
      'application/ecmascript',
      'application/javascript',
      'application/json',
      'application/x-perl',
      'text/ecmascript',
      'text/javascript',
      'text/json',
      'text/x-perl',
    ].includes(mimeType);
  }

  reset(): void {
    this.editor.setValue('');
  }

  write(char: number | string): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.editor.setValue(this.editor.getValue() + char);
  }
}

export default Code;
