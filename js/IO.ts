import { Editor } from 'codemirror';
import { decoders } from './Decoders';
import Renderers from './Renderers';

export class IO {
  constructor(
    private languageSelector: HTMLSelectElement,
    private stdin: Editor,
    private stdout: Renderers,
    private stderr: Renderers,
    private args: Editor
  ) {}
  public static getRaw(field: Editor): string {
    return field.getValue();
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
