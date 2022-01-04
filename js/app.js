import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit/src/FitAddon';
import CodeMirror from 'codemirror';
import 'codemirror/mode/perl/perl';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/search/match-highlighter';
import xxdR, { isXxd } from './xxd-r';

const code = document.querySelector('textarea[name="code"]'),
  args = document.querySelector('textarea[name="args"]'),
  input = document.querySelector('textarea[name="input"]'),
  run = document.querySelector('input[name="run"]'),
  stop = document.querySelector('input[name="stop"]'),
  bytes = document.querySelector('.bytes'),
  bytesCount = document.querySelector('.byte-count'),
  xxdDump = document.querySelector('.xxd-dump'),
  languageSelector = document.querySelector('select[name="lang"]'),
  fit = new FitAddon(),
  stdout = new Terminal({
    rendererType: 'dom',
    theme: {
      background: '#272822',
      foreground: '#d0d0d0',
    },
    convertEol: true,
  }),
  stderr = new Terminal({
    theme: {
      background: '#272822',
      foreground: '#f92672',
    },
    convertEol: true,
  }),
  clearStdout = () => stdout.reset(),
  clearStderr = () => stderr.reset(),
  displayStdout = (data) => {
    stdout.write(data);
  },
  displayStderr = (data) => {
    stderr.write(data);
  },
  resizeOutputs = () => {
    fit.fit();
    stderr.resize(stdout.cols, 6);
  },
  codeEditor = CodeMirror.fromTextArea(code, {
    autoCloseBrackets: true,
    autofocus: true,
    lineNumbers: true,
    matchBrackets: true,
    matchHighlighter: true,
    theme: 'monokai',
  }),
  inputEditor = CodeMirror.fromTextArea(input, {
    mode: null,
    theme: 'monokai',
  });

// outputs
stdout.loadAddon(fit);

stdout.open(document.querySelector('div.stdout'));
stderr.open(document.querySelector('div.stderr'));

resizeOutputs();
window.addEventListener('resize', () => resizeOutputs());

// inputs
codeEditor.setSize('100%', 200);
inputEditor.setSize('100%', 100);

codeEditor.on('change', () => {
  const currentMode = codeEditor.getOption('mode'),
    code = codeEditor.getValue();

  bytes.removeAttribute('hidden');

  // It's an `xxd` dump
  if (isXxd(code)) {
    if (currentMode !== null) {
      codeEditor.setOption('mode', null);
    }

    xxdDump.removeAttribute('hidden');

    const realCode = xxdR(code);

    bytesCount.innerText = realCode.length;

    return;
  }

  xxdDump.setAttribute('hidden', '');

  bytesCount.innerText = code.length;

  // TODO: match against language dropdown if there are more languages available
  if (currentMode !== languageSelector.value) {
    codeEditor.setOption('mode', languageSelector.value);
  }
});

run.addEventListener('click', () => {
  const started = Date.now(),
    stopHandler = () => {
      worker.terminate();

      displayStderr(`\n\nAborted execution after ${Date.now() - started}ms`);

      run.removeAttribute('disabled');
      stop.setAttribute('disabled', '');

      stop.removeEventListener('click', stopHandler);
    };

  clearStdout();
  clearStderr();

  run.setAttribute('disabled', '');
  stop.removeAttribute('disabled');

  const worker = new Worker('./js/worker.js');

  let codeToRun = codeEditor.getValue();

  if (isXxd(codeToRun)) {
    codeToRun = xxdR(codeToRun);
  }

  worker.postMessage({
    type: 'run',
    code: codeToRun,
    args: args.value,
    input: inputEditor.getValue(),
  });

  stop.addEventListener('click', stopHandler);

  worker.onmessage = ({ data }) => {
    const { type, output, error } = data;

    // TODO: check type
    if (output) {
      displayStdout(output);
    }

    if (error) {
      displayStderr(error ?? '');
    }

    if (type === 'done') {
      displayStderr(`\n\nCompleted execution after ${Date.now() - started}ms`);

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
