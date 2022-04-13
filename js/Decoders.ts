export interface Decoder {
  name(): string;
  matches(code: number[]): boolean;
  matchesAsString(code: string): boolean;
  decode(code: number[]): number[];
  decodeAsString(code: string): number[];
}

export class Decoders {
  private registered: Decoder[] = [];

  public register(...decoders: Decoder[]): void {
    this.registered.push(...decoders);
  }

  public decode(code: number[]): number[] {
    return this.decoder(code).decode(code);
  }

  public decodeAsString(code: string): number[] {
    return this.decoderAsString(code).decodeAsString(code);
  }

  public decoder(code: number[]): Decoder {
    const [decoder] = this.registered.filter((decoder): boolean =>
      decoder.matches(code)
    );

    return decoder;
  }

  public decoderAsString(code: string): Decoder {
    const [decoder] = this.registered.filter((decoder): boolean =>
      decoder.matchesAsString(code)
    );

    return decoder;
  }
}

export default Decoders;

export const decoders = new Decoders();
