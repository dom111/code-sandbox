importScripts('../../../../js/lib/webperl-5.28.1/webperl.js');

addEventListener('message', ({ data }) => {
  // TODO: check 'type' param too...
  const { code, args, input } = data;

  Perl.output = (content, channel) => {
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

    Perl.run(code, args.trim() ? args.trim().split(/\n/) : []);
  });
});
