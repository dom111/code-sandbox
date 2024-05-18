export class Options {
  public options: {
    [key: string]: any;
  } = {};

  get<T extends unknown>(name: string, defaultValue: T = null): T {
    return (this.options[name] as T) ?? defaultValue;
  }

  set(name: string, value: any): void {
    this.options[name] = value;
  }
}

export const options = new Options();

export default Options;
