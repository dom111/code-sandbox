importScripts('./lib/webperl.js');

// Perl.noMountIdbfs = true;

addEventListener('message', ({ data }) => {
    // TODO: check 'type' param too...
    const {
        code,
        args,
        input
    } = data;

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

    // FS.createFile('/tmp', 'stdin');
    // FS.writeFile('/tmp/stdin', input);

    Perl.init(() => {
        const needsStdinBeforeEval = args.match(/[napF]/),
            firstNewline = input.indexOf('\n') + 1;

        // TODO: put stdin into a file and pipe that in somehow...
        if (needsStdinBeforeEval) {
            const firstIndex = firstNewline ? firstNewline : input.length;

            Perl.stdin_buf += input.substr(0, firstIndex);
        }

        Perl.start(args.split(/\s+/));

        Perl.stdin_buf += needsStdinBeforeEval ?
            firstNewline ?
                input.substr(firstNewline) :
                ''
            :
            input;

        // Force flushing output with `$|`
        const result = Perl.eval('$|++;\n' + code);

        Perl.end();

        postMessage({
            type: 'done',
            result,
            output: Perl.stdout_buf,
        });
    });
    // }, input);
});