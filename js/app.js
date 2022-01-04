const code = document.querySelector('textarea[name="code"]'),
    args = document.querySelector('textarea[name="args"]'),
    input = document.querySelector('textarea[name="input"]'),
    run = document.querySelector('input[name="run"]'),
    stop = document.querySelector('input[name="stop"]'),
    outputContainer = document.querySelector('pre.output'),
    errorContainer = document.querySelector('pre.error'),
    term = new Terminal({
        convertEol: true
    }),
    clear = () => term.reset(),
    display = (data) => {
        term.write(data);
    };

term.open(document.querySelector('div.terminal'));

const editor = CodeMirror.fromTextArea(code, {
    autoCloseBrackets: true,
    autofocus: true,
    lineNumbers: true,
    matchBrackets: true,
    matchHighlighter: true,
    theme: 'monokai',
});

editor.refresh();

editor.on('change', () => {
    const currentMode = editor.getOption('mode');

    if (editor.getValue().match(/^00000000: /)) {
        if (currentMode !== null) {
            editor.setOption('mode', null);
        }

        return;
    }

    // TODO: match against language dropdown if there are more languages available
    if (currentMode !== 'perl') {
        editor.setOption('mode', 'perl');
    }
})

run.addEventListener('click', () => {
    const started = Date.now(),
        stopHandler = () => {
            worker.terminate();

            errorContainer.innerText += `\n\nAborted execution after ${Date.now() - started}ms`;

            run.removeAttribute('disabled');
            stop.setAttribute('disabled', '');

            stop.removeEventListener('click', stopHandler);
        };

    clear();

    // outputContainer.innerText = '';
    errorContainer.innerText = '';

    run.setAttribute('disabled', '');
    stop.removeAttribute('disabled');

    const worker = new Worker('./js/worker.js');

    let codeToRun = editor.getValue();

    if (codeToRun.match(/^0{7}: /)) {
        codeToRun = codeToRun
            .replace(/(?<=^|\n)\d{7}: /g, '')
            .replace(/\s+.{1,16}(?=$|\n)/g, '')
            .replace(/ /g, '')
            .replace(/../g, (c) => String.fromCharCode(parseInt(c, 16))
            )
    }

    worker.postMessage({
        type: 'run',
        code: codeToRun,
        args: args.value,
        input: input.value,
    });

    stop.addEventListener('click', stopHandler);

    worker.onmessage = ({ data }) => {
        const {
            type,
            output,
            error,
        } = data;

        // TODO: check type
        if (output) {
            display(output);
        }
        // outputContainer.innerText += output ?? '';
        errorContainer.innerText += error ?? '';

        if (type === 'done') {
            errorContainer.innerText += `\n\nCompleted execution after ${Date.now() - started}ms`;

            run.removeAttribute('disabled');
            stop.setAttribute('disabled', '');

            stop.removeEventListener('click', stopHandler);
        }
    };

    worker.onerror = (e) => {
        console.error(e);

        run.removeAttribute('disabled');
        stop.setAttribute('disabled', '');
    };
});
