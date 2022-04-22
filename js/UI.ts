import { Editor, EditorConfiguration, fromTextArea } from 'codemirror';
import { Melba, MelbaConstructorOptions, MelbaType } from 'melba-toast';
import { Renderers, createDevice } from './Renderers';
import CodeInput from './Inputs/Code';
import CodeRenderer from './Renderers/Code';
import IFrame from './Renderers/IFrame';
import IO from './IO';
import Image from './Renderers/Image';
import Inputs from './Inputs';
import PBMImage from './Renderers/PBMImage';
import TTY from './Renderers/TTY';
import codePointsToString from './codePointsToString';
import { decoders } from './Decoders';
import { langs } from './Langs';
import replaceBinaryBytes from './replaceBinaryBytes';

import 'codemirror/addon/comment/comment';
import 'codemirror/addon/comment/continuecomment';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/keymap/sublime';

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
  private addArg: HTMLHeadingElement;
  private args: CodeMirror.Editor;
  private argsWrapper: HTMLDivElement;
  private bytesCount: HTMLSpanElement;
  private bytesPlural: HTMLSpanElement;
  private code: Inputs;
  private codeFooter: Inputs;
  private codeHeader: Inputs;
  private copyLinkButton: HTMLButtonElement;
  private encoded: HTMLSpanElement;
  private expanders: NodeListOf<HTMLButtonElement>;
  private format: HTMLSpanElement;
  private io: IO;
  private langSelector: HTMLSelectElement;
  private markdownButton: HTMLButtonElement;
  private mimeType: string = 'text/plain';
  private mimeTypeInput: HTMLInputElement;
  private runButton: HTMLButtonElement;
  private stderr: Renderers;
  private stdin: CodeMirror.Editor;
  private stdout: Renderers;
  private stopButton: HTMLButtonElement;

  constructor() {
    this.langSelector = document.querySelector(
      'select[name="lang"]'
    ) as HTMLSelectElement;

    this.addRegisteredLangs();

    const stdoutContainer = document.querySelector(
      'div.stdout'
    ) as HTMLDivElement;

    this.codeHeader = new Inputs(
      new CodeInput(document.querySelector('div.header') as HTMLDivElement, {
        autoCloseBrackets: true,
        matchBrackets: true,
        placeholder: 'Header...',
      })
    );
    this.codeHeader.activate(CodeInput);

    this.code = new Inputs(
      new CodeInput(document.querySelector('div.code') as HTMLDivElement, {
        autoCloseBrackets: true,
        autofocus: true,
        matchBrackets: true,
        placeholder: 'Code...',
      })
    );
    this.code.activate(CodeInput);
    this.code.setType(this.langSelector.value);

    this.langSelector.addEventListener('change', () =>
      this.code.setType(this.langSelector.value)
    );

    this.codeFooter = new Inputs(
      new CodeInput(document.querySelector('div.footer') as HTMLDivElement, {
        autoCloseBrackets: true,
        autofocus: true,
        matchBrackets: true,
        placeholder: 'Footer...',
      })
    );
    this.codeFooter.activate(CodeInput);

    this.stdout = createDevice(
      new CodeRenderer(stdoutContainer),
      new PBMImage(stdoutContainer),
      new Image(stdoutContainer),
      new IFrame(stdoutContainer),
      new TTY(stdoutContainer)
    );
    this.stdout.activate('text/plain');

    this.stderr = createDevice(
      new TTY(document.querySelector('div.stderr') as HTMLDivElement, {
        rows: 8,
        theme: {
          foreground: '#f92672',
        },
      })
    );
    this.stderr.activate('text/plain');
    this.stdin = UI.createEditor(
      document.querySelector('textarea[name="input"]') as HTMLTextAreaElement
    );
    this.args = UI.createEditor(
      document.querySelector('textarea[name="args"]') as HTMLTextAreaElement
    );

    this.io = new IO(
      this.langSelector,
      this.stdin,
      this.stdout,
      this.stderr,
      this.args
    );

    this.expanders = document.querySelectorAll(
      'button[name="expand"]'
    ) as NodeListOf<HTMLInputElement>;
    this.argsWrapper = document.querySelector(
      '.args-wrapper'
    ) as HTMLDivElement;
    this.addArg = document.querySelector(
      '.args-wrapper .actions'
    ) as HTMLHeadingElement;
    this.runButton = document.querySelector(
      'button[name="run"]'
    ) as HTMLButtonElement;
    this.stopButton = document.querySelector(
      'button[name="stop"]'
    ) as HTMLButtonElement;
    this.bytesCount = document.querySelector(
      '.bytes .byte-count'
    ) as HTMLSpanElement;
    this.bytesPlural = document.querySelector(
      '.bytes .plural'
    ) as HTMLSpanElement;
    this.encoded = document.querySelector('.encoded') as HTMLSpanElement;
    this.format = document.querySelector('.format') as HTMLSpanElement;
    this.copyLinkButton = document.querySelector(
      'button[name="copy"]'
    ) as HTMLButtonElement;
    this.markdownButton = document.querySelector(
      'button[name="markdown"]'
    ) as HTMLButtonElement;
    this.mimeTypeInput = document.querySelector('.stdout-header input');
    this.connectExpanders();

    // bind events
    this.code.on('change', () => this.codeOnChange());

    this.runButton.addEventListener('click', () => this.runCode());
    this.langSelector.addEventListener('change', () => this.populateArgs());
    this.copyLinkButton.addEventListener('click', () => {
      const link = this.buildLink();

      if (location.href !== link) {
        history.pushState(this.buildHashData(), document.title, link);
      }

      navigator.clipboard.writeText(link);

      UI.copied(this.copyLinkButton);
    });
    this.markdownButton.addEventListener('click', () => {
      navigator.clipboard.writeText(this.buildMarkdown());

      UI.copied(this.markdownButton);
    });
    this.mimeTypeInput.addEventListener('change', () =>
      this.setMimeType(this.mimeTypeInput.value || 'text/plain', false)
    );
    this.mimeTypeInput.addEventListener('keypress', ({ key }) => {
      if (key === 'Enter' && this.mimeType !== this.mimeTypeInput.value) {
        this.setMimeType(this.mimeTypeInput.value || 'text/plain', false);
      }
    });

    addEventListener('keydown', (event) => {
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        const link = this.buildLink();

        history.pushState(this.buildHashData(), document.title, link);
        navigator.clipboard.writeText(link);

        this.toast('Saved!', 'success', {
          hide: 2,
        });

        event.preventDefault();
      }
    });

    addEventListener('hashchange', () => {
      this.parseHashData(location.hash);

      if (this.code.read().length) {
        this.runCode();
      }
    });
    addEventListener('resize', () => this.resize());

    // onload
    this.parseHashData(location.hash);
    try {
      this.populateArgs();
    } catch (e) {
      this.toast(e.message, 'error');
    }
    this.codeOnChange();

    if (this.code.read().length) {
      this.runCode();
    }

    this.resize();

    document
      .querySelector('button.fullscreen-toggle')
      .addEventListener('click', () => this.enterFullscreen());

    document.addEventListener('fullscreenchange', () => this.exitFullscreen());
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

    [this.codeHeader, this.code, this.codeFooter].forEach((inputs) => {
      const decoder = decoders.decoderAsString(inputs.readAsString(null));

      if (decoder.name() !== 'default') {
        inputs.setType(null);

        return;
      }

      inputs.setType(lang.getHighlighterRef());
    });
  }

  public static createEditor(
    element: HTMLTextAreaElement,
    options: EditorConfiguration = {}
  ): Editor {
    return fromTextArea(element, {
      mode: null,
      theme: 'monokai',
      viewportMargin: Infinity,
      ...options,
      extraKeys: {
        'Ctrl-D': 'duplicateLine',
        'Ctrl-/': 'toggleComment',
        'Shift-Tab': false,
        Tab: false,
        // @ts-ignore
        ...(options.extraKeys || {}),
      },
    });
  }

  private resize(): void {
    this.stdout.resize();
    this.stderr.resize();
  }

  private codeOnChange(): void {
    const code = this.code.read();

    this.encoded.setAttribute('hidden', '');

    this.setCodeHighlight();

    const decoder = decoders.decoder(code);

    if (decoder.name() !== 'default') {
      this.encoded.removeAttribute('hidden');

      this.format.innerText = decoder.name();
    }

    const decodedCode = decoder.decode(code);

    this.showBytes(decodedCode.length);
  }

  private runCode(): void {
    const started = Date.now(),
      stopHandler = () => {
        worker.terminate();

        this.stderr.write(`Aborted execution after ${Date.now() - started}ms`);

        this.runButton.removeAttribute('disabled');
        this.stopButton.setAttribute('disabled', '');

        this.stopButton.removeEventListener('click', stopHandler);
      };

    this.stdout.reset();
    this.stderr.reset();

    this.runButton.setAttribute('disabled', '');
    this.stopButton.removeAttribute('disabled');

    const worker = langs.run(
      this.getLangId(),
      [].concat(
        [
          this.codeHeader.read(),
          this.code.read(),
          this.codeFooter.read(),
        ].flatMap((code) => decoders.decode(code))
      ),
      this.io.getArgs(),
      this.io.getStdin()
    );

    this.stopButton.addEventListener('click', stopHandler);

    worker.onmessage = ({ data }) => {
      const { type, output, error } = data;

      if (output) {
        this.stdout.write(output);
      }

      if (error) {
        this.stderr.write(error ?? '');
      }

      if (type === 'done') {
        this.stderr.write(
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
        const argButton = document.createElement('button');

        argButton.append(document.createTextNode(arg));

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

  private static expand(expander: HTMLButtonElement): void {
    const collapser = expander.nextElementSibling as HTMLButtonElement,
      target = document.querySelector(expander.dataset.target);

    if (!target) {
      console.debug('No collapser or target for expander: ', expander);

      return;
    }

    expander.setAttribute('hidden', '');
    target.removeAttribute('hidden');
    collapser.removeAttribute('hidden');
    collapser.focus();
  }

  private static collapse(expander: HTMLButtonElement): void {
    const collapser = expander.nextElementSibling,
      target = document.querySelector(expander.dataset.target);

    if (!target) {
      console.debug('No collapser or target for expander: ', expander);

      return;
    }

    expander.removeAttribute('hidden');
    target.setAttribute('hidden', '');
    collapser.setAttribute('hidden', '');
    expander.focus();
  }

  private connectExpanders(): void {
    this.expanders.forEach((expander) => {
      const collapser = expander.nextElementSibling;

      if (!collapser || !collapser.matches('button[name="collapse"]')) {
        console.debug('No collapser or target for expander: ', expander);

        return;
      }

      expander.addEventListener('click', () => UI.expand(expander));
      collapser.addEventListener('click', () => UI.collapse(expander));
    });
  }

  private setMimeType(mimeType: string, setInput: boolean = true): void {
    this.mimeType = mimeType;

    if (setInput) {
      this.mimeTypeInput.value = mimeType;
    }

    this.stdout.activate(mimeType);
    this.stdout.resize();
  }

  private static copied(button: HTMLButtonElement | HTMLInputElement): void {
    button.setAttribute('disabled', '');
    button.style.width = button.offsetWidth + 'px';
    button.classList.toggle('copied');

    setTimeout(() => {
      button.removeAttribute('disabled');
      button.style.width = null;
      button.classList.toggle('copied');
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
    }

    if (data.footer) {
      UI.expand(footerExpander);
    }

    this.setLang(data.lang ?? this.getLangId());
    this.codeHeader.write(data.header ?? '');
    this.code.write(data.code ?? '');
    this.codeFooter.write(data.footer ?? '');
    this.io.setArgs(data.args ?? '');
    this.io.setStdin(data.input ?? '');

    if (data.mime) {
      this.setMimeType(data.mime);
    }
  }

  private buildHashData() {
    const data: IHashData = {
        lang: this.getLangId(),
        code: this.code.readAsString(null),
      },
      header = this.codeHeader.readAsString(null),
      footer = this.codeFooter.readAsString(null),
      args = this.io.getArgs(),
      input = this.io.getStdin(),
      mime = this.mimeType;

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

    if (mime !== 'text/plain') {
      data.mime = mime;
    }

    return btoa(JSON.stringify(data));
  }

  private buildLink(): string {
    const hash = this.buildHashData();

    return (
      location.protocol + '//' + location.host + location.pathname + '#' + hash
    );
  }

  private buildMarkdown(): string {
    const args = this.io.getArgs().trim().split(/\n/).join(' '),
      lang = langs.get(this.getLangId()),
      key = Math.random().toString(36).slice(2, 10),
      rawCode = decoders.decode(this.code.read()),
      code = replaceBinaryBytes(codePointsToString(rawCode)),
      bytes = code.length;

    return `# [${lang.getName()}]${
      args ? ` + \`${args}\`` : ''
    }, ${bytes} byte${bytes === 1 ? '' : 's'}

<!-- language-all: lang-${lang.getHighlighterRef()} -->

<pre><code>${code.replace(/[&<>]/g, (char) =>
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

  private enterFullscreen(): void {
    document.body.requestFullscreen().then(() => {
      document.body.classList.add('fullscreen');
      this.resize();
    });
  }

  private exitFullscreen(): void {
    document.body.classList.remove('fullscreen');
    this.resize();
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
