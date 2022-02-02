import Lang, { Runner } from './Lang';

export class Langs {
  private data: { [key: string]: Lang } = {};

  public register(...langs: Lang[]): void {
    langs.forEach((lang: Lang): void => {
      this.data[lang.getId()] = lang;
    });
  }

  public get(lang: string): Lang {
    return this.data[lang];
  }

  public all(): string[] {
    return Object.keys(this.data);
  }

  public run(
    langId: string,
    code: number[],
    args: string,
    input: string
  ): Worker {
    return this.data[langId].run(code, args, input);
  }
}

export const defaultRunner =
  (workerURL): Runner =>
  (code: number[], input: string, args: string) => {
    const worker = new Worker(workerURL);

    worker.postMessage({
      type: 'run',
      code,
      args,
      input,
    });

    return worker;
  };

export const langs = new Langs();

export default langs;
