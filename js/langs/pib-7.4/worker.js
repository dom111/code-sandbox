importScripts('../../../../js/lib/pib-7.4/php-web.js');

addEventListener('message', ({ data }) => {
  // TODO: check 'type' param too...
  const { code, args, input } = data;

  document = {};

  const options = {
    endAfterMain: true,
    stdinBuf: '',
    stdinCursor: 0,

    stdin() {
      if (!this.stdinBuf) {
        return null;
      }

      if (this.stdinCursor < this.stdinBuf.length) {
        return this.stdinBuf.charCodeAt(this.stdinCursor++);
      }

      return null;
    },
    stdout(char) {
      postMessage({
        type: 'output',
        content: String.fromCharCode(char),
      });
    },
    sterr(char) {
      postMessage({
        type: 'output',
        error: String.fromCharCode(char),
      });
    },
  };

  PHP(options).then((Module) => {
    const mainArgs = args.trim() ? args.trim().split(/\n/) : [];

    let result;

    Module.ccall(
      'pib_init',
      'number',
      [mainArgs.map(() => 'string')],
      mainArgs
    );

    Module.stdinBuf += input;

    if (mainArgs.includes('-r') || mainArgs.includes('-R')) {
      // mainArgs.push(code);
      result = Module.ccall('pib_run', 'number', ['array'], [code]);
    } else {
      result = Module.ccall('pib_exec', 'string', ['array'], [code]);
      // if (!FS.isDir('/tmp')) {
      //   FS.createPath('/', 'tmp', true, true);
      // }
      //
      // if (FS.isFile('/tmp/script.php')) {
      //   FS.unlink('/tmp/script.php');
      // }
      //
      // FS.createDataFile(
      //   '/tmp',
      //   'script.php',
      //   Int32Array.from(code),
      //   true,
      //   true,
      //   true
      // );
      //
      // mainArgs.push('/tmp/script.php');
    }

    postMessage({
      type: 'done',
      result,
    });

    Module._pib_destroy();
  });
});
