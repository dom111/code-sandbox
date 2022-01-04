importScripts('./lib/webperl.js');

// Perl.noMountIdbfs = true;

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
    let prefix = '',
      suffix = '';

    Perl.stdin_buf += input;

    const result = Perl.run(
      [
        ...[...prefix].map((c) => c.charCodeAt()),
        ...code,
        ...[...suffix].map((c) => c.charCodeAt()),
      ],
      args.split(/\s+/)
    );
    // Perl.end();

    // postMessage({
    //   type: 'done',
    //   result,
    //   output: Perl.stdout_buf,
    // });
  });
});
