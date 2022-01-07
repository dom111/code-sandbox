addEventListener('message', ({ data }) => {
    const { code, input } = data;

    // overwrite builtins to support this approach
    // stdin
    prompt = () => input;

    // stdout
    console.log = (...data) => {
        postMessage({
            type: 'output',
            output: data.join(''),
        });
    };

    // stderr
    console.warn = console.error = console.debug = (...data) => {
        postMessage({
            type: 'output',
            error: data.join(''),
        });
    };

    let result;

    try {
        result = eval(String.fromCharCode(...code));

        if (result instanceof Function) {
            result = result(input);
        }
    }
    catch (e) {
        postMessage({
            type: 'output',
            error: e.message,
        });

        // if we don't do this, we could end up with a function object that "could not be cloned":
        //    https://stackoverflow.com/a/42376465/3145856
        result = null;
    }

    postMessage({
        type: 'done',
        output: result,
    });
});
