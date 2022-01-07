import { Editor } from 'codemirror';
import { Terminal } from 'xterm';
import { decoders } from './Decoders';

export class IO {
  constructor(
    private languageSelector: HTMLSelectElement,
    private header: Editor,
    private code: Editor,
    private footer: Editor,
    private stdin: Editor,
    private stdout: Terminal,
    private stderr: Terminal,
    private args: Editor
  ) {}

  public writeStdout(text: string): void {
    // patch for xterm.js - this allows VT and FF but patches \n, vs. convertEol option
    this.stdout.write(text.replace(/(?<!\r)\n/g, '\r\n'));
  }

  public writeStderr(text: string): void {
    // patch for xterm.js - this allows VT and FF but patches \n, vs. convertEol option
    this.stderr.write(text.replace(/(?<!\r)\n/g, '\r\n'));
  }

  public clearStdout(): void {
    this.stdout.reset();
  }

  public clearStderr(): void {
    this.stderr.reset();
  }

  public static getRaw(field: Editor): string {
    return field.getValue();
  }

  private static getAsArray(field: Editor): number[] {
    const code = IO.getRaw(field),
      decoder = decoders.decoder(code);

    return decoder.decode(code);
  }

  public getRawCodeHeader(): string {
    return IO.getRaw(this.header);
  }

  public getCodeHeaderAsArray(): number[] {
    return IO.getAsArray(this.header);
  }

  public setCodeHeader(code: string): void {
    this.header.setValue(code);
  }

  public getRawCode(): string {
    return IO.getRaw(this.code);
  }

  public getCodeAsArray(): number[] {
    return IO.getAsArray(this.code);
  }

  public getCodeAsString(replaceBinaryBytes: string | null = '.'): string {
    let code = this.getRawCode(),
      decoder = decoders.decoder(code);

    if (decoder.name() !== 'default') {
      code = String.fromCharCode(...decoder.decode(code));
    }

    if (replaceBinaryBytes !== null) {
      code = code.replace(/[\x00-\x1f\x7f-\xff]/g, replaceBinaryBytes);
    }

    return code;
  }

  public getFullCodeAsArray(): number[] {
    return [
      ...this.getCodeHeaderAsArray(),
      ...this.getCodeAsArray(),
      ...this.getCodeFooterAsArray(),
    ];
  }

  public setCode(value: string): void {
    this.code.setValue(value);
  }

  public onCodeChange(handler: Function): void {
    this.code.on('change', (): void => handler());
  }

  public getRawCodeFooter(): string {
    return IO.getRaw(this.footer);
  }

  public getCodeFooterAsArray(): number[] {
    return IO.getAsArray(this.footer);
  }

  public setCodeFooter(code: string): void {
    this.footer.setValue(code);
  }

  public getArgs(): string {
    return this.args.getValue();
  }

  public setArgs(value: string): void {
    this.args.setValue(value);
  }

  public argsRefresh(): void {
    this.args.refresh();
  }

  public getStdin(): string {
    return this.stdin.getValue();
  }

  public setStdin(value: string): void {
    this.stdin.setValue(value);
  }
}

export default IO;
