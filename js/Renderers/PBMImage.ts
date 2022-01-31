import Image from './Image';
import InvalidFormat from './Error/InvalidFormat';
import { Renderer } from '../Renderers';

export type PBMHeader =
  | [string, number, number, number] // P1: type, width, height, offset
  | [string, number, number, number, number]; // P3: type, width, height, maxValue, offset

/**
 * @see https://en.wikipedia.org/wiki/Netpbm
 */
export class PBMImage extends Image implements Renderer {
  ppmBuffer: string = '';
  superTimeout: number | null = null;

  public activate(mimeType: string) {
    super.activate('image/png');
  }

  public matches(mimeType: string): boolean {
    return [
      'image/x-portable-bitmap',
      'image/x-portable-graymap',
      'image/x-portable-pixmap',
      'image/x-portable-anymap',
    ].includes(mimeType);
  }

  public reset() {
    super.reset();

    this.ppmBuffer = '';
  }

  public write(char: string | number): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.ppmBuffer += char;

    if (this.ppmBuffer.length < 10) {
      return;
    }

    // Wait for data to stop streaming
    if (this.superTimeout) {
      clearTimeout(this.superTimeout);
    }

    this.superTimeout = setTimeout(() => {
      try {
        super.reset();

        super.write(this.convertToPNG());
      } catch (e) {
        console.error(e);
      }
    }, 50);
  }

  private convertToPNG(): string {
    if (!/^P[1-7]/.test(this.ppmBuffer)) {
      throw new InvalidFormat();
    }

    const header = this.extractPBMHeader();

    if (!header) {
      throw new InvalidFormat();
    }

    const [format] = header;

    if (!format) {
      throw new InvalidFormat();
    }

    if (format === 'P1') {
      const [, width, height, offset] = header;

      return this.parseP1(width, height, offset);
    }

    if (format === 'P2') {
      const [, width, height, maxValue, offset] = header;

      return this.parseP2(width, height, maxValue, offset);
    }

    if (format === 'P3') {
      const [, width, height, maxValue, offset] = header;

      return this.parseP3(width, height, maxValue, offset);
    }

    if (format === 'P4') {
      const [, width, height, offset] = header;

      return this.parseP4(width, height, offset);
    }

    if (format === 'P5') {
      const [, width, height, maxValue, offset] = header;

      return this.parseP2(width, height, maxValue, offset, true);
    }

    if (format === 'P6') {
      const [, width, height, maxValue, offset] = header;

      return this.parseP3(width, height, maxValue, offset, true);
    }

    throw new InvalidFormat('Currently unsupported.');
  }

  private createCanvas(
    width: number,
    height: number
  ): [HTMLCanvasElement, CanvasRenderingContext2D, ImageData] {
    const canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      imageData = new ImageData(width, height);

    canvas.width = width;
    canvas.height = height;

    return [canvas, context, imageData];
  }

  private canvasToRawPNG(canvas: HTMLCanvasElement): string {
    // Convert back to raw data from a data: URI
    return atob(
      canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
    );
  }

  private parseP1(width: number, height: number, offset: number): string {
    const [canvas, context, imageData] = this.createCanvas(width, height),
      data = this.asciiDataGenerator(offset, false);

    for (let index = 0; index < width * height * 4; ) {
      const value = data.next().value ? 0 : 255;

      imageData.data[index++] = value;
      imageData.data[index++] = value;
      imageData.data[index++] = value;
      imageData.data[index++] = 255;
    }

    context.putImageData(imageData, 0, 0, 0, 0, width, height);

    return this.canvasToRawPNG(canvas);
  }

  private parseP2(
    width: number,
    height: number,
    maxValue: number,
    offset: number,
    binary: boolean = false
  ): string {
    const [canvas, context, imageData] = this.createCanvas(width, height),
      data = binary
        ? this.binaryDataGenerator(offset)
        : this.asciiDataGenerator(offset);

    for (let index = 0; index < width * height * 4; ) {
      const value = Math.floor((data.next().value / maxValue) * 255);

      imageData.data[index++] = value;
      imageData.data[index++] = value;
      imageData.data[index++] = value;
      imageData.data[index++] = 255;
    }

    context.putImageData(imageData, 0, 0, 0, 0, width, height);

    return this.canvasToRawPNG(canvas);
  }

  private parseP3(
    width: number,
    height: number,
    maxValue: number,
    offset: number,
    binary: boolean = false
  ): string {
    const [canvas, context, imageData] = this.createCanvas(width, height),
      data = binary
        ? this.binaryDataGenerator(offset)
        : this.asciiDataGenerator(offset);

    for (let index = 0; index < width * height * 4; ) {
      imageData.data[index++] = Math.floor(
        ((data.next().value || 0) / maxValue) * 255
      );
      imageData.data[index++] = Math.floor(
        ((data.next().value || 0) / maxValue) * 255
      );
      imageData.data[index++] = Math.floor(
        ((data.next().value || 0) / maxValue) * 255
      );
      imageData.data[index++] = 255;
    }

    context.putImageData(imageData, 0, 0, 0, 0, width, height);

    return this.canvasToRawPNG(canvas);
  }

  private parseP4(width: number, height: number, offset: number): string {
    const [canvas, context, imageData] = this.createCanvas(width, height),
      data = this.binaryDataGenerator(offset);

    for (let index = 0; index < width * height * 4; ) {
      let row = '';

      for (
        let rowCounter = 0;
        rowCounter < Math.ceil(width / 8);
        rowCounter++
      ) {
        row += ('00000000' + data.next().value.toString(2)).slice(-8);
      }

      for (let pixel = 0; pixel < width; pixel++) {
        const colour = row[pixel] === '1' ? 0 : 255;

        imageData.data[index++] = colour;
        imageData.data[index++] = colour;
        imageData.data[index++] = colour;
        imageData.data[index++] = 255;
      }
    }

    context.putImageData(imageData, 0, 0, 0, 0, width, height);

    return this.canvasToRawPNG(canvas);
  }

  private extractPBMHeader(): PBMHeader | null {
    const type = this.ppmBuffer.slice(0, 2),
      withoutMaxValue =
        /^(P[14])\s+(?:#[^\n]*\s*)*(\d+)\s+(?:#[^\n]*\s*)*(\d+)\s*(?:#[^\n]*\s*)*/,
      withMaxValue =
        /^(P[2356])\s+(?:#[^\n]*\s*)*(\d+)\s+(?:#[^\n]*\s*)*(\d+)\s+(?:#[^\n]*\s*)*(\d+)\s*(?:#[^\n]*\s*)*/;

    if (type === 'P1' || type === 'P4') {
      const match = this.ppmBuffer.match(withoutMaxValue);

      if (!match) {
        throw new InvalidFormat();
      }

      return [
        match[1], // format
        parseInt(match[2], 10), // width
        parseInt(match[3], 10), // height
        match[0].length, // offset
      ];
    }

    if (type === 'P2' || type === 'P3' || type === 'P5' || type === 'P6') {
      const match = this.ppmBuffer.match(withMaxValue);

      if (!match) {
        throw new InvalidFormat();
      }

      return [
        match[1], // format
        parseInt(match[2], 10), // width
        parseInt(match[3], 10), // height
        parseInt(match[4], 10), // max value
        match[0].length, // offset
      ];
    }
  }

  private *asciiDataGenerator(
    offset: number,
    separator: boolean = true
  ): Generator<number> {
    let block = '';

    for (
      let currentPosition = offset, comment = false;
      currentPosition < this.ppmBuffer.length;
      currentPosition++
    ) {
      const currentChar = this.ppmBuffer[currentPosition];

      if (/#/.test(currentChar)) {
        if (block) {
          yield parseInt(block, 10);

          block = '';
        }

        comment = true;
      }

      if (/\n/.test(currentChar) && comment) {
        comment = false;
      }

      if (comment) {
        continue;
      }

      if (/\s/.test(currentChar) && block.length > 0) {
        yield parseInt(block, 10);

        block = '';
      }

      if (/\d/.test(currentChar)) {
        block += currentChar;
      }

      if (separator === false && block) {
        yield parseInt(block, 10);

        block = '';
      }
    }

    yield parseInt(block, 10);
  }

  private *binaryDataGenerator(offset: number): Generator<number> {
    let block = '';

    for (
      let currentPosition = offset;
      currentPosition < this.ppmBuffer.length;
      currentPosition++
    ) {
      const currentChar = this.ppmBuffer[currentPosition];

      yield currentChar.charCodeAt(0);
    }

    yield parseInt(block, 10);
  }
}

export default PBMImage;
