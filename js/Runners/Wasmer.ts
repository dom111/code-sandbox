import Runner from '../Runner';
import { SpawnOptions } from '@wasmer/sdk/dist/pkg/wasmer_js';
import codePointsToString from '../codePointsToString';
// @ts-ignore
import { init, Instance, Wasmer as WasmerSDK } from "https://unpkg.com/@wasmer/sdk@latest?module";

export class Wasmer extends Runner {
  #package: WasmerSDK;
  #instance: Instance;

  constructor(private packageName: string, private filename: false | string = 'script', private spawnOptions?: SpawnOptions) {
    super();
  }

  /**
   * @param code
   * @param input STDIN
   * @param args The literal string `$filename` will be replaced with the path
   *        to the code (e.g. `/app/script`) and is appended to the arguments
   *        unless the `filename` parameter to the constructor is `false`.
   *        `$code` will be replaced with a string representation of the code to
   *        execute.
   */
  async init(code: number[], input: string, args: string) {
    await init();

    // Show an alert after a second as that probably means we're having to download the package
    const preparingMessageTimeout = window.setTimeout(() =>
      this.emit('toast', {
        message: 'Downloading package from wasmer.io. This might take some time...',
        type: 'info',
      })
    , 1000);

    this.#package = await WasmerSDK.fromRegistry(this.packageName);

    if (this.filename) {
      if (!args.includes('$filename')) {
        args += (args.length > 0 ? '\n'  : '') + '$filename';
      }

      args = args.replace('$filename', `/app/${this.filename}`)
    }

    const entrypointArgs = {
      args: args.split('\n')
        .map((arg) => {
          if (arg !== '$code') {
            return arg;
          }

          return codePointsToString(code);
        }),
      stdin: input,
      ...this.spawnOptions,
      mount: {
        ...this.spawnOptions?.mount,
        '/app': {
          ...(this.spawnOptions?.mount && ( '/app' in this.spawnOptions?.mount) ? this.spawnOptions?.mount['/app'] : {}),
          ...(this.filename ? { [this.filename]: new Uint8Array(code) } : {}),
        },
      },
    };

    window.clearTimeout(preparingMessageTimeout);

    this.#instance = await this.#package.entrypoint.run(entrypointArgs);

    const { code: exitCode, stderr, stdout } = await this.#instance.wait();

    stdout.split('')
      .forEach((char) =>
        this.emit('output', {
          output: char,
        })
      );

    stderr.split('')
      .forEach((char) =>
        this.emit('output', {
          error: char,
        })
      );

    this.emit('done', {
      code: exitCode,
    });
  }

  terminate(): void {
    // TODO
    // return this.#instance.free();
  }
}

export default Wasmer;
