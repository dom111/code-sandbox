import { Decoder } from '../Decoders';
import Default from './Default';

export class Base64 extends Default implements Decoder {
  public name(): string {
    return 'base64';
  }

  public matchesAsString(code: string): boolean {
    // base64 input is at least 4 chars, pick 8 as `prin` is valid
    if (code.length < 8 || /[^A-Za-z0-9+/=]/.test(code)) {
      return false;
    }

    try {
      atob(code);

      return true;
    } catch (e) {
      return false;
    }
  }

  public decodeAsString(code: string): number[] {
    return Array.from(atob(code)).map((c: string): number => c.charCodeAt(0));
  }
}
export default Base64;
