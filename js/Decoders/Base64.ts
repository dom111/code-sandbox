import { Decoder } from '../Decoders';

export class Base64 implements Decoder {
  public name(): string {
    return 'base64';
  }

  public matches(code: string): boolean {
    // base64 input is at least 4 chars
    if (code.length < 4) {
      return false;
    }

    try {
      atob(code);

      return true;
    } catch (e) {
      return false;
    }
  }

  public decode(code: string): number[] {
    return Array.from(atob(code)).map((c: string): number => c.charCodeAt(0));
  }
}
export default Base64;
