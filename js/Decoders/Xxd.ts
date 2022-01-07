import { Decoder } from '../Decoders';

export class Xxd implements Decoder {
  public name(): string {
    return 'xxd';
  }

  public matches(code: string): boolean {
    return /^(\d{7,8}: (((.{2}){1,2} ){1,8}) .+(\n|$))+$/.test(code);
  }

  public decode(code: string): number[] {
    return code
      .trim()
      .replace(/(?<=^|\n)\d{7,8}: (((.{2}){1,2} ){1,8}).+/g, '$1')
      .replace(/\s+/g, '')
      .match(/../g)
      .map((c: string): number => parseInt(c, 16));
  }
}
export default Xxd;
