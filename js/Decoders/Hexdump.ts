import { Decoder } from '../Decoders';
import Default from './Default';

export class Hexdump extends Default implements Decoder {
  public name(): string {
    return 'hexdump';
  }

  public matchesAsString(code: string): boolean {
    return /^(\d{7} (((.{2}){1,2} ){1,8})(\n|$))+$/.test(code);
  }

  public decodeAsString(code: string): number[] {
    return code
      .trim()
      .replace(/(?<=^|\n)\d{7} (((.{2}){1,2} ){1,8}).+/g, '$1')
      .replace(/\s+/g, '')
      .replace(/(..)(..)/g, '$2$1')
      .replace(/00$/, '')
      .match(/../g)
      .map((c: string): number => parseInt(c, 16));
  }
}

export default Hexdump;
