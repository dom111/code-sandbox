export interface Input {
  activate(device: Inputs): void;
  deactivate(): void;
  isActive(): boolean;
  matches(data: string): boolean;
  on(eventName: string, handler: (...args: any[]) => void): void;
  read(): number[];
  readAsString(replaceBinaryBytes: string | null): string;
  reset(): void;
  resize(): void;
  setType(type: string | null): void;
  write(data: string | number[]): void;
}

export type InputConstructor = new (
  parent: HTMLElement,
  ...args: any[]
) => Input;

export class Inputs {
  private buffer: number[] = [];
  private registered: Input[] = [];
  private type: string;

  public constructor(...inputs: Input[]) {
    this.register(...inputs);
  }

  private active(): Input {
    const [input] = this.registered.filter((input) => input.isActive());

    return input;
  }

  public activate(toActivate: InputConstructor | Input): void {
    this.registered.reduce((value, input): boolean => {
      // Activate the required input
      if (
        !value &&
        ((typeof toActivate === 'function' && input instanceof toActivate) ||
          input === toActivate)
      ) {
        if (!input.isActive()) {
          input.activate(this);
          input.reset();
          input.write(this.buffer);
        }

        return true;
      }

      input.deactivate();
      input.reset();

      return value;
    }, false);

    this.resize();
  }

  public on(eventName: string, handler: (event: Event) => void): void {
    this.registered.forEach((input) => input.on(eventName, handler));
  }

  public read(): number[] {
    return this.active().read();
  }

  public readAsString(replaceBinaryBytes: string | null = '.'): string {
    return this.active().readAsString(replaceBinaryBytes);
  }

  public register(...inputs: Input[]): void {
    this.registered.push(...inputs);
  }

  public reset(): void {
    this.buffer.splice(0);
    this.registered.forEach((input) => input.reset());
  }

  public resize(): void {
    this.registered.forEach((input) => {
      if (input.isActive()) {
        input.resize();
      }
    });
  }

  public setBuffer(buffer: number[]): void {
    this.buffer.push(...buffer);
  }

  public setType(type: string | null): void {
    this.type = type;

    this.registered.forEach((input) => input.setType(type));
  }

  public write(char: number | number[] | string): void {
    const writeBuffer = [];

    if (typeof char === 'number') {
      writeBuffer.push(char);
    }

    if (Array.isArray(char)) {
      char.forEach((char) => writeBuffer.push(char));
    }

    if (typeof char === 'string') {
      char.split('').forEach((char) => writeBuffer.push(char.charCodeAt(0)));
    }

    this.registered.filter((input) => {
      if (input.isActive()) {
        input.write(writeBuffer);
      }
    });

    writeBuffer.forEach((char) => this.buffer.push(char));
  }
}

export default Inputs;
