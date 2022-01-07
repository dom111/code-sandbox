import { Decoder } from '../Decoders';

export class Default implements Decoder {
  public name(): string {
    return 'default';
  }

  public matches(): boolean {
    return true;
  }

  public decode(code: string): number[] {
    return Array.from(code).map((char: string): number => char.charCodeAt(0));
  }
}

export default Default;
