import { Decoder } from '../Decoders';
import Default from './Default';

export class Xxd extends Default implements Decoder {
  public name(): string {
    return 'xxd';
  }

  public matchesAsString(code: string): boolean {
    return /^([\da-f]{7,8}: (((.{2}){1,2} ){1,8}) .+(\n|$))+$/.test(code);
  }

  public decodeAsString(code: string): number[] {
    return code
      .trim()
      .replace(/(?<=^|\n)[\da-f]{7,8}: (((.{2}){1,2} ){1,8}).+/g, '$1')
      .replace(/\s+/g, '')
      .match(/../g)
      .map((c: string): number => parseInt(c, 16));
  }
}
export default Xxd;
