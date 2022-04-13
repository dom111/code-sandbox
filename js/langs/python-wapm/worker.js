// import browserBindings from '@wasmer/wasi/lib/bindings/browser';
import { Buffer } from 'buffer';
self.Buffer = Buffer; // Yuck...

// export class MemFS {
//   constructor();
//   readDir(path: string): Array<any>;
//   createDir(path: string): void;
//   removeDir(path: string): void;
//   removeFile(path: string): void;
//   rename(path: string, to: string): void;
//   metadata(path: string): object;
//   open(path: string, options: any): JSVirtualFile;
// }

// export class JSVirtualFile {
//   lastAccessed(): BigInt;
//   lastModified(): BigInt;
//   createdTime(): BigInt;
//   size(): BigInt;
//   setLength(new_size: BigInt): void;
//   read(): Uint8Array;
//   readString(): string;
//   write(buf: Uint8Array): number;
//   writeString(buf: string): number;
//   flush(): void;
//   seek(position: number): number;
// }

import { WASI, init } from '@wasmer/wasi';

addEventListener('message', async ({ data }) => {
  try {
    // TODO: check 'type' param too...
    const { code, args, input } = data;

    // This is needed to load the WASI library first (since is a Wasm module)
    await init(input);

    // fs.mkdirpSync('/tmp');
    // fs.writeFileSync('/tmp/script.py', Uint8Array.from(code));

    // const argsArray = args.split(/\n/);

    // argsArray.push('/tmp/script.py');

    const wasi = new WASI({
        env: {},
        // args: ['--mapdir=lib:lib'],
        args: ['python', '/tmp/test.py'],
        // bindings: {
        //   // ...browserBindings,
        //   fs,
        //   exit(code) {
        //     console.log('done: ' + code);
        //   },
        // },
      }),
      { fs } = wasi;

    // Instantiate the WASI module
    await wasi.instantiate(
      await WebAssembly.compileStreaming(
        await fetch(
          '../../../../wapm_packages/python/python@0.1.0/lib/python.wasm'
          // '../../../../wapm_packages/rustpython/rustpython@0.1.3/target/wasm32-wasi/release/rustpython.wasm'
        )
      ),
      {}
    );

    // wasi.setStdinString('print("Hello, World!")');

    wasi.start();

    // fs.writeFileSync('/dev/stdin', input);

    // fs.watch('/dev/stdout', { persistent: true }, (eventType) => {
    //   const content = fs.readFileSync('/dev/stdout');
    //
    //   console.log(eventType + ': ' + content);
    // });
  } catch (e) {
    postMessage({
      type: 'failed',
      error: e.stack,
    });
  }
});
