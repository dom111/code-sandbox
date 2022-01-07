export interface Decoder {
  name(): string;
  matches(code: string): boolean;
  decode(code: string): number[];
}

export class Decoders {
  private registered: Decoder[] = [];

  public register(...decoders: Decoder[]): void {
    this.registered.push(...decoders);
  }

  public decoder(code: string): Decoder {
    const [decoder] = this.registered.filter((decoder): boolean =>
      decoder.matches(code)
    );

    return decoder;
  }
}

export default Decoders;

export const decoders = new Decoders();
