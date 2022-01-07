import { Decoder } from '../Decoders';

export class Base64 implements Decoder {
  public name(): string {
    return 'base64';
  }

  public matches(code: string): boolean {
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
