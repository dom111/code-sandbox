import IO from './IO';
import { getLangs, getName, getURL, run } from './langs';

// import langs to be made available
import './langs/perl/app';

// TODO: break this down
const code = document.querySelector(
    'textarea[name="code"]'
  ) as HTMLTextAreaElement,
  args = document.querySelector('textarea[name="args"]') as HTMLTextAreaElement,
  input = document.querySelector(
    'textarea[name="input"]'
  ) as HTMLTextAreaElement,
  runButton = document.querySelector('input[name="run"]') as HTMLInputElement,
  stopButton = document.querySelector('input[name="stop"]') as HTMLInputElement,
  copyButton = document.querySelector('input[name="copy"]') as HTMLInputElement,
  markdownButton = document.querySelector(
    'input[name="markdown"]'
  ) as HTMLInputElement,
  bytesCount = document.querySelector('.bytes .byte-count') as HTMLSpanElement,
  bytesPlural = document.querySelector('.bytes .plural') as HTMLSpanElement,
  xxdDump = document.querySelector('.xxd-dump') as HTMLSpanElement,
  languageSelector = document.querySelector(
    'select[name="lang"]'
  ) as HTMLSelectElement,
  argButtons = document.querySelectorAll(
    '.add-arg'
  ) as NodeListOf<HTMLInputElement>,
  runCode = () => {
    const started = Date.now(),
      stopHandler = () => {
        worker.terminate();

        io.writeStderr(`\n\nAborted execution after ${Date.now() - started}ms`);

        runButton.removeAttribute('disabled');
        stopButton.setAttribute('disabled', '');

        stopButton.removeEventListener('click', stopHandler);
      };

    io.clearStdout();
    io.clearStderr();

    runButton.setAttribute('disabled', '');
    stopButton.removeAttribute('disabled');

    const worker = run(
      io.getLang(),
      io.getCodeAsArray(),
      io.getArgs(),
      io.getStdin()
    );

    stopButton.addEventListener('click', stopHandler);

    worker.onmessage = ({ data }) => {
      const { type, output, error } = data;

      // TODO: check type
      if (output) {
        io.writeStdout(output);
      }

      if (error) {
        io.writeStderr(error ?? '');
      }

      if (type === 'done') {
        io.writeStderr(
          `\n\nCompleted execution after ${Date.now() - started}ms`
        );

        runButton.removeAttribute('disabled');
        stopButton.setAttribute('disabled', '');

        stopButton.removeEventListener('click', stopHandler);
      }
    };

    worker.onerror = (e) => {
      console.error(e);

      runButton.removeAttribute('disabled');
      stopButton.setAttribute('disabled', '');
    };
  },
  showBytes = (byteCount) => {
    bytesCount.innerText = byteCount;

    if (byteCount === 1) {
      bytesPlural.setAttribute('hidden', '');

      return;
    }

    bytesPlural.removeAttribute('hidden');
  },
  codeOnChange = () => {
    const code = io.getCodeAsArray();

    xxdDump.setAttribute('hidden', '');

    io.setCodeHighlight(io.getLang());

    if (io.codeIsXxd()) {
      io.setCodeHighlight(null);

      xxdDump.removeAttribute('hidden');
    }

    showBytes(code.length);
  },
  parseHashData = (hash) => {
    if (!hash || hash.length < 2) {
      return;
    }

    try {
      const jsonData = atob(hash.slice(1)),
        data = JSON.parse(jsonData);

      languageSelector.value = data.lang ?? languageSelector.value;
      io.setCode(data.code ?? '');
      io.setArgs(data.args ?? '');
      io.setStdin(data.input ?? '');
    } catch (e) {
      if (e instanceof DOMException) {
        console.error('Bad base64 data: ', e);

        return;
      }

      if (e instanceof SyntaxError) {
        console.error('Bad JSON data: ', e);

        return;
      }

      throw e;
    }
  },
  buildHashData = () => {
    const data = {},
      lang = languageSelector.value,
      code = io.getRawCode(),
      args = io.getArgs(),
      input = io.getStdin();

    Object.entries({
      lang,
      code,
      args,
      input,
    }).forEach(([key, value]) => {
      if (value) {
        data[key] = value;
      }
    });

    return btoa(JSON.stringify(data));
  },
  buildLink = () => {
    const hash = buildHashData();

    return (
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '#' +
      hash
    );
  },
  copied = (button: HTMLButtonElement | HTMLInputElement) => {
    const originalText = button.value;

    button.setAttribute('disabled', '');
    button.style.width = button.offsetWidth + 'px';
    button.value = 'Copied!';

    window.setTimeout(() => {
      button.removeAttribute('disabled');
      button.style.width = null;
      button.value = originalText;
    }, 1000);
  };

const io = new IO(
  languageSelector,
  code,
  input,
  document.querySelector('div.stdout'),
  document.querySelector('div.stderr'),
  args
);

io.resize();
window.addEventListener('resize', () => io.resize());

codeOnChange();
io.onCodeChange(() => codeOnChange());

argButtons.forEach((argButton) =>
  argButton.addEventListener('click', () => {
    const currentValue = io.getArgs() ?? '',
      arg = argButton.dataset.arg,
      match = new RegExp('(\\n|^)' + arg + '(\\n|$)');

    if (match.test(currentValue)) {
      return;
    }

    io.setArgs((currentValue + '\n' + arg).trim());
  })
);

// actions
runButton.addEventListener('click', () => runCode());

parseHashData(window.location.hash);

if (io.getCodeAsArray().length) {
  runCode();
}

window.addEventListener('hashchange', () => {
  parseHashData(window.location.hash);

  if (io.getCodeAsArray().length) {
    runCode();
  }
});

copyButton.addEventListener('click', () => {
  const link = buildLink();

  window.history.pushState(buildHashData(), document.title, link);
  navigator.clipboard.writeText(link);

  copied(copyButton);
});

markdownButton.addEventListener('click', () => {
  const args = io.getArgs().split(/\n/).join(' '),
    lang = io.getLang(),
    key = Math.floor(Math.random() * 1e16)
      .toString(36)
      .slice(1, 9),
    bytes = io.getCodeAsArray().length;

  navigator.clipboard.writeText(`# [${getName(lang)}]${
    args ? ` + \`${args}\`` : ''
  }, ${bytes} byte${bytes === 1 ? '' : 's'}

<!-- language-all: lang-${lang} -->

<pre><code>${io
    .getCodeAsString()
    .replace(/[&<>]/g, (char) =>
      char === '<'
        ? '&lt;'
        : char === '>'
        ? '&gt;'
        : char === '&'
        ? '&amp;'
        : char
    )}</code></pre>

[Try it online!][TIO-${key}]

[${getName(lang)}]: ${getURL(lang)}
[TIO-${key}]: ${buildLink()}`);

  copied(markdownButton);
});
