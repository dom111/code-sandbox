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
        // TODO: put stdin into a file and pipe that in somehow...

        Perl.start(args.split(/\s+/));

        // Force flushing output with `$|`
        const result = Perl.eval('$|++;\n' + code);

        postMessage({
            type: 'done',
            result,
            output: Perl.stdout_buf,
        });
    }, input);
});