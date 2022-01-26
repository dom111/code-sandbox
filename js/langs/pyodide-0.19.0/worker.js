// importScripts('https://cdn.jsdelivr.net/pyodide/v0.19.0/full/pyodide.asm.js');
// importScripts('../../../../js/lib/pyodide-0.19.0/pyodide.asm.js');

importScripts('https://cdn.jsdelivr.net/pyodide/v0.19.0/full/pyodide.js');

let stdinBufferIndex = 0,
  stdinBuffer = '';

addEventListener('message', ({ data }) =>
  loadPyodide({
    arguments: data.args.trim() ? data.args.trim().split('\n') : [],
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.19.0/full/',
    onExit(status) {
      postMessage({
        type: 'done',
        status,
      });
    },
    stderr(content) {
      postMessage({
        type: 'output',
        error: content,
      });
    },
    stdin() {
      if (stdinBuffer && stdinBufferIndex < stdinBuffer.length) {
        const nextNewline = stdinBuffer.indexOf('\n', stdinBufferIndex),
          readUntil = nextNewline < 0 ? stdinBuffer.length : nextNewline + 1;

        const line = stdinBuffer.substr(
          stdinBufferIndex,
          readUntil - stdinBufferIndex
        );

        stdinBufferIndex = readUntil;

        return line;
      }

      return '';
    },
    stdout(content) {
      // Hide Pyodide's messaging
      if (content === 'Python initialization complete') {
        return;
      }

      postMessage({
        type: 'output',
        output: content,
      });
    },
  }).then((pyodide) => {
    const Module = pyodide,
      { FS } = Module,
      { code, args: rawArgs, input } = data,
      args = rawArgs.trim() ? rawArgs.trim().split(/\n/) : [];

    args.push('/tmp/script.py');

    stdinBuffer = input;

    if (!FS.isDir('/tmp')) {
      FS.createPath('/', 'tmp', true, true);
    }

    if (FS.isFile('/tmp/script.py')) {
      FS.unlink('/tmp/script.py');
    }

    FS.createDataFile(
      '/tmp',
      'script.py',
      Uint8Array.from(code),
      true,
      true,
      true
    );

    try {
      pyodide.runPython(String.fromCharCode(...code));
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

// addEventListener('message', ({ data }) => {
//   _createPyodideModule({
//     noInitialRun: false,
//     locateFile(file) {
//       return 'https://cdn.jsdelivr.net/pyodide/v0.19.0/full/' + file;
//       // return '../../../../js/lib/pyodide-0.19.0/' + file;
//     },
//     onExit(status) {
//       postMessage({
//         type: 'done',
//         status,
//       });
//     },
//     stderr(content) {
//       postMessage({
//         type: 'output',
//         error: content,
//       });
//     },
//     stdin() {
//       if (!stdinBuffer) {
//         return null;
//       }
//
//       if (stdinBufferIndex < stdinBuffer.length) {
//         const nextNewline =
//           stdinBuffer.indexOf('\n') < 0
//             ? stdinBuffer.length
//             : stdinBuffer.indexOf('\n');
//
//         return stdinBuffer.substr(stdinBufferIndex, nextNewline);
//       }
//
//       return null;
//     },
//     stdout(content) {
//       // Hide Pyodide's messaging
//       if (content === 'Python initialization complete') {
//         return;
//       }
//
//       postMessage({
//         type: 'output',
//         output: content,
//       });
//     },
//   }).then((Module) => {
//     const { FS } = Module,
//       { code, args: rawArgs, input } = data,
//       args = rawArgs.trim() ? rawArgs.trim().split(/\n/) : [];
//
//     args.push('/tmp/script.py');
//
//     stdinBuffer = input;
//
//     if (!FS.isDir('/tmp')) {
//       FS.createPath('/', 'tmp', true, true);
//     }
//
//     if (FS.isFile('/tmp/script.py')) {
//       FS.unlink('/tmp/script.py');
//     }
//
//     FS.createDataFile(
//       '/tmp',
//       'script.py',
//       Int32Array.from(code),
//       true,
//       true,
//       true
//     );
//
//     try {
//       // Module.callMain(args);
//       Module.run(args);
//     } catch (e) {
//       postMessage({
//         type: 'output',
//         error: e.message,
//       });
//     }
//
//     postMessage({
//       type: 'done',
//     });
//   });
// });
