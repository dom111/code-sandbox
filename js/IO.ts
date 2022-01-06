import { ITerminalOptions, Terminal } from 'xterm';
import { Editor, EditorConfiguration, fromTextArea } from 'codemirror';
import { isXxd, xxdR } from './xxdR';
import { FitAddon } from 'xterm-addon-fit/src/FitAddon';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import { getLangs, getName } from './langs';

export class IO {
  private languageSelector: HTMLSelectElement;
  private stdout: Terminal;
  private stderr: Terminal;
  private fit: FitAddon;
  private stdin: Editor;
  private args: Editor;
  private code: Editor;

  constructor(
    languageSelectorElement: HTMLSelectElement,
    codeElement: HTMLTextAreaElement,
    stdinElement: HTMLTextAreaElement,
    stdoutElement: HTMLElement,
    stderrElement: HTMLElement,
    argsElement: HTMLTextAreaElement
  ) {
    this.languageSelector = languageSelectorElement;

    this.addRegisteredLangs();

    this.stdout = IO.createTerminal();

    this.stderr = IO.createTerminal({
      theme: {
        foreground: '#f92672',
      },
    });

    this.fit = new FitAddon();

    this.stdout.loadAddon(this.fit);
    this.stdout.open(stdoutElement);
    this.stderr.open(stderrElement);

    this.code = IO.createEditor(codeElement, {
      autoCloseBrackets: true,
      autofocus: true,
      matchBrackets: true,
    });
    this.stdin = IO.createEditor(stdinElement);
    this.args = IO.createEditor(argsElement);
  }

  private addRegisteredLangs(): void {
    getLangs().forEach((lang) => {
      const option = document.createElement('option');

      option.setAttribute('value', lang);
      option.append(document.createTextNode(getName(lang)));

      this.languageSelector.append(option);
    });
  }

  public setLang(lang: string): void {
    const availableLangs = getLangs();

    if (!availableLangs.includes(lang)) {
      throw new TypeError(`Unknown lang: ${lang}.`);
    }

    this.languageSelector.value = lang;

    this.setCodeHighlight(lang);
  }

  public getLang(): string {
    return this.languageSelector.value;
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

  private static createEditor(
    element: HTMLTextAreaElement,
    options: EditorConfiguration = {}
  ): Editor {
    return fromTextArea(element, {
      mode: null,
      theme: 'monokai',
      viewportMargin: Infinity,
      extraKeys: {
        'Shift-Tab': false,
        Tab: false,
      },
      ...options,
    });
  }

  public writeStdout(text: string): void {
    this.stdout.write(text);
  }

  public writeStderr(text: string): void {
    this.stderr.write(text);
  }

  public clearStdout(): void {
    this.stdout.reset();
  }

  public clearStderr(): void {
    this.stderr.reset();
  }

  public resize(): void {
    this.fit.fit();
    this.stderr.resize(this.stdout.cols, 6);
  }

  public codeIsXxd(): boolean {
    return isXxd(this.code.getValue());
  }

  public getRawCode(): string {
    return this.code.getValue();
  }

  public getCodeAsArray(): number[] {
    const code = this.getRawCode();

    if (isXxd(code)) {
      return xxdR(code);
    }

    return Array.from(code).map((c: string): number => c.charCodeAt(0));
  }

  public getCodeAsString(replaceBinaryBytes: string | null = '.'): string {
    let code = this.getRawCode();

    if (isXxd(code)) {
      code = String.fromCharCode(...xxdR(code));
    }

    if (replaceBinaryBytes !== null) {
      code = code.replace(/[\x00-\x1f\x7f-\xff]/g, replaceBinaryBytes);
    }

    return code;
  }

  public setCode(value: string): void {
    this.code.setValue(value);
  }

  public setCodeHighlight(lang: string): void {
    if (this.code.getOption('mode') === lang) {
      return;
    }

    this.code.setOption('mode', lang);
  }

  public onCodeChange(handler: Function): void {
    this.code.on('change', (): void => handler());
  }

  public getArgs(): string {
    return this.args.getValue();
  }

  public setArgs(value: string): void {
    this.args.setValue(value);
  }

  public getStdin(): string {
    return this.stdin.getValue();
  }

  public setStdin(value: string): void {
    this.stdin.setValue(value);
  }
}

export default IO;
