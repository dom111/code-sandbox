import Runner from './Runner';

export type RunnerProvider = (code: number[], input: string, args: string) => Promise<Runner>;

export class Lang {
  constructor(
    private id: string,
    private name: string,
    private runner: RunnerProvider,
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

  run(code: number[], input: string, args: string): Promise<Runner> {
    return this.runner(code, input, args);
  }
}

export default Lang;
