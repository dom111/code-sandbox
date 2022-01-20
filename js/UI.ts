import { Editor, EditorConfiguration, fromTextArea } from 'codemirror';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit/src/FitAddon';
import IO from './IO';
import { langs } from './Langs';
import {
  Melba,
  MelbaConstructorOptions,
  MelbaOptions,
  MelbaType,
} from 'melba-toast';

import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import { decoders } from './Decoders';

export type IHashData = {
  lang: string;
  header?: string;
  code: string;
  footer?: string;
  args?: string;
  input?: string;
  type?: 'tty' | 'resource';
  mime?: string;
};

export class UI {
  private io: IO;
  private expanders: NodeListOf<HTMLInputElement>;
  private outputTypes: NodeListOf<HTMLInputElement>;
  private argsWrapper: HTMLDivElement;
  private addArg: HTMLHeadingElement;
  private stopButton: HTMLInputElement;
  private runButton: HTMLInputElement;
  private bytesCount: HTMLSpanElement;
  private bytesPlural: HTMLSpanElement;
  private encoded: HTMLSpanElement;
  private format: HTMLSpanElement;
  private langSelector: HTMLSelectElement;
  private copyLinkButton: HTMLInputElement;
  private markdownButton: HTMLInputElement;
  private stdout: Terminal;
  private stderr: Terminal;
  private fit: FitAddon;
  private codeHeader: CodeMirror.Editor;
  private code: CodeMirror.Editor;
  private codeFooter: CodeMirror.Editor;
  private stdin: CodeMirror.Editor;
  private args: CodeMirror.Editor;

  constructor() {
    this.langSelector = document.querySelector(
      'select[name="lang"]'
    ) as HTMLSelectElement;

    this.addRegisteredLangs();

    this.stdout = UI.createTerminal();

    this.stderr = UI.createTerminal({
      theme: {
        foreground: '#f92672',
      },
    });

    this.fit = new FitAddon();

    this.stdout.loadAddon(this.fit);
    this.stdout.open(document.querySelector('div.stdout') as HTMLDivElement);
    this.stderr.open(document.querySelector('div.stderr') as HTMLDivElement);

    this.codeHeader = UI.createEditor(
      document.querySelector('textarea[name="header"]') as HTMLTextAreaElement,
      {
        autoCloseBrackets: true,
        autofocus: true,
        matchBrackets: true,
      }
    );
    this.code = UI.createEditor(
      document.querySelector('textarea[name="code"]') as HTMLTextAreaElement,
      {
        autoCloseBrackets: true,
        autofocus: true,
        matchBrackets: true,
      }
    );
    this.codeFooter = UI.createEditor(
      document.querySelector('textarea[name="footer"]') as HTMLTextAreaElement,
      {
        autoCloseBrackets: true,
        autofocus: true,
        matchBrackets: true,
      }
    );
    this.stdin = UI.createEditor(
      document.querySelector('textarea[name="input"]') as HTMLTextAreaElement
    );
    this.args = UI.createEditor(
      document.querySelector('textarea[name="args"]') as HTMLTextAreaElement
    );

    this.io = new IO(
      this.langSelector,
      this.codeHeader,
      this.code,
      this.codeFooter,
      this.stdin,
      this.stdout,
      this.stderr,
      this.args,
      document.querySelector('.html-out')
    );

    this.expanders = document.querySelectorAll(
      'input[name="expand"]'
    ) as NodeListOf<HTMLInputElement>;
    this.argsWrapper = document.querySelector(
      '.args-wrapper'
    ) as HTMLDivElement;
    this.addArg = document.querySelector('.add-arg') as HTMLHeadingElement;
    this.runButton = document.querySelector(
      'input[name="run"]'
    ) as HTMLInputElement;
    this.stopButton = document.querySelector(
      'input[name="stop"]'
    ) as HTMLInputElement;
    this.bytesCount = document.querySelector(
      '.bytes .byte-count'
    ) as HTMLSpanElement;
    this.bytesPlural = document.querySelector(
      '.bytes .plural'
    ) as HTMLSpanElement;
    this.encoded = document.querySelector('.encoded') as HTMLSpanElement;
    this.format = document.querySelector('.format') as HTMLSpanElement;
    this.copyLinkButton = document.querySelector(
      'input[name="copy"]'
    ) as HTMLInputElement;
    this.markdownButton = document.querySelector(
      'input[name="markdown"]'
    ) as HTMLInputElement;
    this.outputTypes = document.querySelectorAll('.stdout-header button');
    this.connectExpanders();
    this.parseHashData(window.location.hash);
    try {
      this.populateArgs();
    } catch (e) {
      this.toast(e.message, 'error');
    }
    this.codeOnChange();

    if (this.io.getCodeAsArray().length) {
      this.runCode();
    }

    this.resize();

    // bind events
    this.io.onCodeChange(() => this.codeOnChange());

    this.runButton.addEventListener('click', () => this.runCode());
    this.langSelector.addEventListener('change', () => this.populateArgs());
    this.copyLinkButton.addEventListener('click', () => {
      const link = this.buildLink();

      window.history.pushState(this.buildHashData(), document.title, link);
      navigator.clipboard.writeText(link);

      UI.copied(this.copyLinkButton);
    });
    this.markdownButton.addEventListener('click', () => {
      navigator.clipboard.writeText(this.buildMarkdown());

      UI.copied(this.markdownButton);
    });
    this.outputTypes.forEach((button) =>
      button.addEventListener('click', () => this.setOutputType(button))
    );

    window.addEventListener('hashchange', () => {
      this.parseHashData(window.location.hash);

      if (this.io.getCodeAsArray().length) {
        this.runCode();
      }
    });
    window.addEventListener('resize', () => this.resize());
  }

  private addRegisteredLangs(): void {
    langs.all().forEach((langKey) => {
      const lang = langs.get(langKey),
        option = document.createElement('option');

      option.setAttribute('value', lang.getId());
      option.append(document.createTextNode(lang.getName()));

      this.langSelector.append(option);
    });
  }

  private setLang(lang: string): void {
    const availableLangs = langs.all();

    if (!availableLangs.includes(lang)) {
      throw new TypeError(`Unknown lang: ${lang}.`);
    }

    this.langSelector.value = lang;

    this.setCodeHighlight();
  }

  private getLangId(): string {
    return this.langSelector.value;
  }

  private setCodeHighlight(): void {
    const lang = langs.get(this.getLangId());

    [this.codeHeader, this.code, this.codeFooter].forEach((editor) => {
      const decoder = decoders.decoder(IO.getRaw(editor));

      if (decoder.name() !== 'default') {
        if (editor.getOption('mode') !== null) {
          editor.setOption('mode', null);
        }

        return;
      }

      if (editor.getOption('mode') !== lang.getHighlighterRef()) {
        editor.setOption('mode', lang.getHighlighterRef());
      }
    });
  }

  private static createTerminal(options: ITerminalOptions = {}): Terminal {
    return new Terminal({
      ...options,
      theme: {
        background: '#272822',
        cursor: 'transparent',
        foreground: '#f8f8f2',
        ...(options.theme ?? {}),
      },
    });
  }

  private static createEditor(
    element: HTMLTextAreaElement,
    options: EditorConfiguration = {}
  ): Editor {
    return fromTextArea(element, {
      mode: null,
      theme: 'monokai',
      viewportMargin: Infinity,
      extraKeys: {
        'Shift-Tab': false,
        Tab: false,
      },
      ...options,
    });
  }

  private resize(): void {
    if (this.stdout.element.parentElement.hasAttribute('hidden')) {
      this.fit.activate(this.stderr);

      this.fit.fit();

      this.stderr.resize(this.stderr.cols, 6);

      return;
    }

    this.fit.activate(this.stdout);

    this.fit.fit();
    this.stderr.resize(this.stdout.cols, 6);
  }

  private codeOnChange(): void {
    const code = this.io.getCodeAsArray();

    this.encoded.setAttribute('hidden', '');

    this.setCodeHighlight();

    const decoder = decoders.decoder(this.io.getRawCode());

    if (decoder.name() !== 'default') {
      this.encoded.removeAttribute('hidden');

      this.format.innerText = decoder.name();
    }

    this.showBytes(code.length);
  }

  private runCode(): void {
    const started = Date.now(),
      stopHandler = () => {
        worker.terminate();

        this.io.writeStderr(
          `Aborted execution after ${Date.now() - started}ms`
        );

        this.runButton.removeAttribute('disabled');
        this.stopButton.setAttribute('disabled', '');

        this.stopButton.removeEventListener('click', stopHandler);
      };

    this.io.clearStdout();
    this.io.clearStderr();

    this.runButton.setAttribute('disabled', '');
    this.stopButton.removeAttribute('disabled');

    const worker = langs.run(
      this.getLangId(),
      this.io.getFullCodeAsArray(),
      this.io.getArgs(),
      this.io.getStdin()
    );

    this.stopButton.addEventListener('click', stopHandler);

    worker.onmessage = ({ data }) => {
      const { type, output, error } = data;

      if (output) {
        this.io.writeStdout(output);
      }

      if (error) {
        this.io.writeStderr(error ?? '');
      }

      if (type === 'done') {
        this.io.writeStderr(
          `Completed execution after ${Date.now() - started}ms`
        );

        this.runButton.removeAttribute('disabled');
        this.stopButton.setAttribute('disabled', '');

        this.stopButton.removeEventListener('click', stopHandler);

        // Make sure the process is stopped
        worker.terminate();
      }
    };

    worker.onerror = (e) => {
      this.toast(`Worker error: ${e.message}`, 'error');

      this.runButton.removeAttribute('disabled');
      this.stopButton.setAttribute('disabled', '');
    };
  }

  private populateArgs(): void {
    while (this.addArg.firstElementChild) {
      this.addArg.firstElementChild.remove();
    }

    const lang = langs.get(this.getLangId());

    if (!lang) {
      throw new TypeError('Unregistered lang: ' + this.getLangId());
    }

    const args = lang.getArgs();

    if (args !== null) {
      this.argsWrapper.removeAttribute('hidden');

      args.forEach((arg) => {
        const argButton = document.createElement('input');

        argButton.setAttribute('type', 'button');
        argButton.setAttribute('value', arg);

        argButton.addEventListener('click', () => {
          const currentValue = this.io.getArgs() ?? '',
            match = new RegExp('(\\n|^)' + arg + '(\\n|$)');

          if (match.test(currentValue)) {
            return;
          }

          this.io.setArgs((currentValue + '\n' + arg).trim());
        });

        this.addArg.append(argButton);
      });
    } else {
      this.argsWrapper.setAttribute('hidden', '');
    }

    this.io.argsRefresh();
  }

  private static expand(expander: HTMLInputElement): void {
    const collapser = expander.nextElementSibling,
      target = document.querySelector(expander.dataset.target);

    if (!target) {
      console.debug('No collapser or target for expander: ', expander);

      return;
    }

    expander.setAttribute('hidden', '');
    target.removeAttribute('hidden');
    collapser.removeAttribute('hidden');
  }

  private static collapse(expander: HTMLInputElement): void {
    const collapser = expander.nextElementSibling,
      target = document.querySelector(expander.dataset.target);

    if (!target) {
      console.debug('No collapser or target for expander: ', expander);

      return;
    }

    expander.removeAttribute('hidden');
    target.setAttribute('hidden', '');
    collapser.setAttribute('hidden', '');
  }

  private connectExpanders(): void {
    this.expanders.forEach((expander) => {
      const collapser = expander.nextElementSibling;

      if (!collapser || !collapser.matches('input[name="collapse"]')) {
        console.debug('No collapser or target for expander: ', expander);

        return;
      }

      expander.addEventListener('click', () => UI.expand(expander));
      collapser.addEventListener('click', () => UI.collapse(expander));
    });
  }

  private setOutputType(button: HTMLButtonElement): void {
    const [current] = Array.from(this.outputTypes).filter((button) =>
      button.hasAttribute('disabled')
    );

    if (current === button) {
      return;
    }

    current.removeAttribute('disabled');
    document.querySelector(current.dataset.target).setAttribute('hidden', '');

    button.setAttribute('disabled', '');
    document.querySelector(button.dataset.target).removeAttribute('hidden');

    this.resize();
  }

  private getOutputType(): string {
    const [current] = Array.from(this.outputTypes).filter((button) =>
      button.hasAttribute('disabled')
    );

    return current.dataset.type;
  }

  private static copied(button: HTMLButtonElement | HTMLInputElement): void {
    const originalText = button.value;

    button.setAttribute('disabled', '');
    button.style.width = button.offsetWidth + 'px';
    button.value = 'Copied!';

    window.setTimeout(() => {
      button.removeAttribute('disabled');
      button.style.width = null;
      button.value = originalText;
    }, 1000);
  }

  private parseHashData(hash): void {
    if (!hash || hash.length < 2) {
      return;
    }

    let data;

    try {
      const jsonData = atob(hash.slice(1));

      data = JSON.parse(jsonData);
    } catch (e) {
      if (e instanceof DOMException) {
        this.toast('Unable to decode URL data. Aborting.', 'error');

        return;
      }

      if (e instanceof SyntaxError) {
        this.toast('Unable to decode JSON data. Aborting.', 'error');

        return;
      }

      throw e;
    }

    const [headerExpander] = Array.from(this.expanders).filter((expander) =>
        expander.parentElement.matches('.code-header')
      ),
      [footerExpander] = Array.from(this.expanders).filter((expander) =>
        expander.parentElement.matches('.code-footer')
      );

    if (data.header) {
      UI.expand(headerExpander);
    } else {
      UI.collapse(headerExpander);
    }

    if (data.footer) {
      UI.expand(footerExpander);
    } else {
      UI.collapse(footerExpander);
    }

    this.setLang(data.lang ?? this.getLangId());
    this.io.setCodeHeader(data.header ?? '');
    this.io.setCode(data.code ?? '');
    this.io.setCodeFooter(data.footer ?? '');
    this.io.setArgs(data.args ?? '');
    this.io.setStdin(data.input ?? '');

    if (data.type) {
      this.outputTypes.forEach((button) => {
        if (button.dataset.type === data.type) {
          this.setOutputType(button);
        }
      });
    }

    // `mime` being set implies `type`
    if (data.mime) {
      this.io.setHTMLOutMimeType(data.mime);

      if (!data.type) {
        this.outputTypes.forEach((button) => {
          if (button.dataset.type === 'resource') {
            this.setOutputType(button);
          }
        });
      }
    }
  }

  private buildHashData() {
    const data: IHashData = {
        lang: this.getLangId(),
        code: this.io.getRawCode(),
      },
      header = this.io.getRawCodeHeader(),
      footer = this.io.getRawCodeFooter(),
      args = this.io.getArgs(),
      input = this.io.getStdin(),
      type = this.getOutputType(),
      mime = this.io.getHTMLOutMimeType();

    Object.entries({
      header,
      footer,
      args,
      input,
    }).forEach(([key, value]) => {
      if (value) {
        data[key] = value;
      }
    });

    // we don't need to set both mime and type most of the time
    if (type === 'resource') {
      if (mime === 'text/html') {
        data.type = 'resource';
      } else {
        data.mime = mime;
      }
    }

    return btoa(JSON.stringify(data));
  }

  private buildLink(): string {
    const hash = this.buildHashData();

    return (
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '#' +
      hash
    );
  }

  private buildMarkdown(): string {
    const args = this.io.getArgs().trim().split(/\n/).join(' '),
      lang = langs.get(this.getLangId()),
      key = Math.random().toString(36).slice(2, 10),
      bytes = this.io.getCodeAsArray().length;

    return `# [${lang.getName()}]${
      args ? ` + \`${args}\`` : ''
    }, ${bytes} byte${bytes === 1 ? '' : 's'}

<!-- language-all: lang-${lang.getHighlighterRef()} -->

<pre><code>${this.io
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

[${lang.getName()}]: ${lang.getURL()}
[TIO-${key}]: ${this.buildLink()}`;
  }

  private showBytes(byteCount: number): void {
    this.bytesCount.innerText = byteCount.toString();

    if (byteCount === 1) {
      this.bytesPlural.setAttribute('hidden', '');

      return;
    }

    this.bytesPlural.removeAttribute('hidden');
  }

  public toast(
    content: string,
    type: MelbaType,
    options: Omit<MelbaConstructorOptions, 'content' | 'type'> = {}
  ): Melba {
    if (!options.events) {
      options.events = {};
    }

    if (!options.events.click) {
      options.events.click = [];
    }

    options.events.click.push((toast) => toast.hide());

    return new Melba({
      ...options,
      content,
      type,
    });
  }
}

export default UI;
