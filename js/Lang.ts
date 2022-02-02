export type Runner = (code: number[], input: string, args: string) => Worker;

export class Lang {
  constructor(
    private id: string,
    private name: string,
    private runner: Runner,
    private url: string = null,
    private args: string[] | null = null,
    private highlighterRef: string = id
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getURL(): string {
    return this.url;
  }

  getArgs(): string[] | null {
    return this.args;
  }

  getHighlighterRef(): string {
    return this.highlighterRef;
  }

  run(code: number[], args: string, input: string): Worker {
    return this.runner(code, input, args);
  }
}

export default Lang;
