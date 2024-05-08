import { Editor } from 'codemirror';
import { decoders } from './Decoders';

export class IO {
  constructor(private stdin: Editor, private args: Editor) {}

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
    return decoders
      .decodeAsString(this.stdin.getValue())
      .reduce((value, char) => value + String.fromCharCode(char), '');
  }

  public setStdin(value: string): void {
    this.stdin.setValue(value);
  }
}

export default IO;
