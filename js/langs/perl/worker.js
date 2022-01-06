importScripts('../../lib/webperl/webperl.js');

addEventListener('message', ({ data }) => {
  // TODO: check 'type' param too...
  const { code, args, input } = data;

  Perl.output = (content, channel) => {
    // patch for xterm.js - this allows VT and FF but patches \n, vs. convertEol option
    content = content.replace(/(?<!\r)\n/g, '\r\n');

    if (channel === 2) {
      postMessage({
        type: 'output',
        error: content,
      });

      return;
    }

    postMessage({
      type: 'output',
      output: content,
    });
  };

  Perl.endAfterMain = true;

  Perl.addStateChangeListener((from, to) => {
    if (to === 'Ended') {
      postMessage({
        type: 'done',
      });
    }
  });

  Perl.init(() => {
    Perl.stdin_buf += input;

    Perl.run(code, args ? args.split(/\n/) : []);
  });
});
