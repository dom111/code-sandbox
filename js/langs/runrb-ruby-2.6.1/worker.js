self.exports = {};
self.module = {
  exports: self.exports,
};

importScripts('../../../../js/lib/runrb-ruby-2.6.1/miniruby.js');
import run from '../../lib/runrb-ruby-2.6.1/miniruby.js';

console.log(module);
console.log(run);

addEventListener('message', ({ data }) =>
  module
    .exports({
      locateFile: function (path) {
        if (path.endsWith('.wasm')) {
          return '../../lib/runrb-ruby-2.6.1/miniruby.wasm';
        }

        return path;
      },
      onExit: ({ status }) => {
        // exit() system call
        postMessage({ done: true, status });
      },
      noInitialRun: true,
      noExitRuntime: false,

      stdin() {
        return null;
      },
      print(output) {
        self.postMessage({ fd: 1, output: output + '\n' });
      },
      printErr(output) {
        switch (output) {
          case 'Calling stub instead of sigaction()':
            // ignore
            break;

          default:
            postMessage({ fd: 2, output: output + '\n' });
        }
      },
    })
    .then((Module) => {
      const { FS } = Module,
        { code, args: rawArgs, input } = data,
        args = rawArgs.trim() ? rawArgs.trim().split(/\n/) : [];

      args.push('/tmp/script.rb');

      stdinBuffer = input;

      if (!FS.isDir('/tmp')) {
        FS.createPath('/', 'tmp', true, true);
      }

      if (FS.isFile('/tmp/script.rb')) {
        FS.unlink('/tmp/script.rb');
      }

      FS.createDataFile(
        '/tmp',
        'script.rb',
        Uint8Array.from(code),
        true,
        true,
        true
      );

      try {
        Module.callMain(args);
      } catch (e) {
        postMessage({
          type: 'output',
          error: e.message,
        });
      }

      postMessage({
        type: 'done',
      });
    })
);
