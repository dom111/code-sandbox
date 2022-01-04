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

  Perl.init(() => {
    let prefix = '',
      suffix = '';

    // TODO: look into why this isn't working for everything (-anpF).
    // Perl.start(args.split(/\s+/));
    Perl.start([]);

    Perl.stdin_buf += input;

    // Force flushing output with `$|` - doesn't look like this is needed?
    // const result = Perl.eval('$|++;\n' + code);

    const match = args.match(/F(\S+)?/);

    if (match) {
      prefix =
        `@F = split/\\Q${match[1] ?? ''.replace(/^\/|\/$/g, '')}/,$_;\n` +
        prefix;
    } else if (args.match(/a/)) {
      prefix = `@F = grep$_,split/\\s+/,$_;\n` + prefix;
    }

    if (args.match(/p/)) {
      suffix += ';\nprint;\n' + suffix;
    }

    if (args.match(/l/)) {
      prefix = '$\\=$/;\nchomp;\n' + prefix;
    }

    if (args.match(/[anpF]/)) {
      prefix = 'while(<STDIN>) {\n' + prefix;
      suffix += ';\n}\n';
    }

    const result = Perl.eval([
      ...[...prefix].map((c) => c.charCodeAt()),
      ...code,
      ...[...suffix].map((c) => c.charCodeAt()),
    ]);

    Perl.end();

    postMessage({
      type: 'done',
      result,
      output: Perl.stdout_buf,
    });
  });
});
