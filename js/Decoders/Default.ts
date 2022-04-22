import { Decoder } from '../Decoders';
import codePointsToString from '../codePointsToString';
import stringToCodePoints from '../stringToCodePoints';

export class Default implements Decoder {
  public name(): string {
    return 'default';
  }

  protected codePointsToString(code: number[]): string {
    return codePointsToString(code);
  }

  protected stringToCodePoints(code: string): number[] {
    return stringToCodePoints(code);
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
