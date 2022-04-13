import { Decoder } from '../Decoders';

export class Default implements Decoder {
  public name(): string {
    return 'default';
  }

  protected codePointsToString(code: number[]): string {
    return code.reduce((code, ord) => code + String.fromCharCode(ord), '');
  }

  protected stringToCodePoints(code: string): number[] {
    return code.split('').map((c: string): number => c.charCodeAt(0));
  }

  public matches(code: number[]): boolean {
    return this.matchesAsString(this.codePointsToString(code));
  }

  public matchesAsString(code: string): boolean {
    return true;
  }

  public decode(code: number[]): number[] {
    return this.decodeAsString(this.codePointsToString(code));
  }

  public decodeAsString(code: string): number[] {
    return this.stringToCodePoints(code);
  }
}

export default Default;
