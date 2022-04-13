import { init, WASI } from '@wasmer/wasi';

export const wapmWrapper = async (wasmPath: string, args: string[], env: { [key: string]: string }): WASI => {
  // This is needed to load the WASI library first (since is a Wasm module)
  await init();

  const wasi = new WASI({
      env,
      args,
    }),
    moduleBytes = fetch(wasmPath),
    module = await WebAssembly.compileStreaming(moduleBytes);

  // Instantiate the WASI module
  await wasi.instantiate(module, {});

  return wasi;
};

export default wapmWrapper;
