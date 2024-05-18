import Lang from './Lang';
import WorkerRunner from './Runners/Worker';
import Runner from './Runner';
import Wasmer from './Runners/Wasmer';
import { SpawnOptions } from '@wasmer/sdk/dist/pkg/wasmer_js';

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

  public async run(
    langId: string,
    code: number[],
    args: string,
    input: string
  ): Promise<Runner> {
    return await this.data[langId].run(code, input, args);
  }
}

export const workerRunner =
  (workerURL: string | URL) =>
  async (code: number[], input: string, args: string): Promise<Runner> => {
    const runner = new WorkerRunner(workerURL);

    runner.init(code, input, args);

    return runner;
  };

export const wasmerRunner =
  (packageName: string, filename: false | string = 'script', spawnOptions?: SpawnOptions) =>
  async (code: number[], input: string, args: string): Promise<Runner> => {
    const runner = new Wasmer(packageName, filename, spawnOptions);

    runner.init(code, input, args);

    return runner;
  };

export const langs = new Langs();

export default langs;
