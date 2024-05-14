import {getRawProperties, getRawProperty} from '../lib/getProperties';
import {getStderrText, getStdoutText} from "../lib/getTerminalText";
import {getCodeFooterText, getCodeHeaderText, getCodeText, getStdinText} from "../lib/getCodemirrorText";
import {grantClipboardPermissions} from "../lib/grantClipboardPermissions";
import { ElementHandle } from 'puppeteer';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:8000/';

describe('Code Sandbox', () => {
  describe('basic functionality', () => {
    [
      ['.code-header > button', '.header'],
      ['.code-footer > button', '.footer'],
    ]
      .forEach(([buttonSelector, elementSelector]) =>
        it(`should be possible to expand and collapse the various sections (${buttonSelector}, ${elementSelector})`, async () => {
          await page.goto(baseUrl);

          const [expand, collapse] = await page.$$(buttonSelector) as ElementHandle<HTMLButtonElement>[],
            element = await page.$(elementSelector) as ElementHandle<HTMLDivElement>;

          await Promise.all([expand, collapse, element]
            .map(async (handle) => expect(handle).not.toBeUndefined()));

          expect(await getRawProperty(expand, 'hidden')).toBe(false);
          expect(await getRawProperty(collapse, 'hidden')).toBe(true);
          expect(await getRawProperty(element, 'hidden')).toBe(true);

          await expand.click();

          expect(await getRawProperty(expand, 'hidden')).toBe(true);
          expect(await getRawProperty(collapse, 'hidden')).toBe(false);
          expect(await getRawProperty(element, 'hidden')).toBe(false);

          await collapse.click();

          expect(await getRawProperty(expand, 'hidden')).toBe(false);
          expect(await getRawProperty(collapse, 'hidden')).toBe(true);
          expect(await getRawProperty(element, 'hidden')).toBe(true);
        })
      );

    it('should be possible to change the language', async () => {
      await page.goto(baseUrl);

      const languageSelector = await page.$(
        'select[name="lang"]'
      ) as ElementHandle<HTMLSelectElement>;

      expect(languageSelector).not.toBeNull();

      const options = await getRawProperties<HTMLOptionElement>(
        languageSelector.$$('option'),
        'value'
      );

      expect(await getRawProperty<HTMLSelectElement>(
        languageSelector,
        'selectedIndex'
      )).toBe(0);
      expect(options).toMatchObject([
        'javascript-browser',
        'webperl-5.28.1',
      ]);
      await languageSelector.select('webperl-5.28.1');

      const argsText = await getRawProperties<HTMLButtonElement>(
        page.$$('.args-wrapper .actions button') as Promise<ElementHandle<HTMLButtonElement>[]>,
        'innerText'
      );

      expect(argsText).toMatchObject([ '-M5.10.0', '-F', '-l', '-p' ]);
    });

    it('should correctly handle permalinks, running the code and displaying the output', async () => {
      await page.goto(baseUrl + '#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiJF89XCJIZWxsbywgJF8hXCIiLCJhcmdzIjoiLXAiLCJpbnB1dCI6IldvcmxkIn0=');

      const languageSelector = await page.$(
          'select[name="lang"]'
        ) as ElementHandle<HTMLSelectElement>,
        runButton = await page.$(
          'button[name="run"]'
        ) as ElementHandle<HTMLButtonElement>,
        stopButton = await page.$(
          'button[name="stop"]'
        ) as ElementHandle<HTMLButtonElement>;

      expect(languageSelector).not.toBeNull();
      expect(runButton).not.toBeNull();
      expect(stopButton).not.toBeNull();
      expect(await getRawProperty<HTMLSelectElement>(
        languageSelector,
        'selectedIndex'
      )).toBe(1);
      expect(await getRawProperty(runButton, 'disabled')).toBe(true);
      expect(await getRawProperty(stopButton, 'disabled')).toBe(false);

      // wait for the run to finish
      await page.waitForFunction(() => document.querySelector('button[name="run"]:not([disabled])'), {
        polling: 'mutation',
      });
      expect(await getRawProperty(runButton, 'disabled')).toBe(false);
      expect(await getRawProperty(stopButton, 'disabled')).toBe(true);
      expect(await getRawProperty(page.$('.header') as Promise<ElementHandle<HTMLDivElement>>, 'hidden')).toBe(true);
      expect(await getCodeHeaderText(page)).toBe('');
      expect(await getCodeText(page)).toBe('$_="Hello, $_!"');
      expect(await getRawProperty(page.$('.footer') as Promise<ElementHandle<HTMLDivElement>>, 'hidden')).toBe(true);
      expect(await getCodeFooterText(page)).toBe('');
      expect(await getStdinText(page)).toBe('World');
      await page.waitForFunction(() => document.querySelector('.stdout .tty .xterm .xterm-accessibility .live-region').innerHTML !== '', {
        polling: 'mutation',
      });
      await expect(await getStdoutText(page)).toBe('Hello, World!');
      await page.waitForFunction(() => document.querySelector('.stderr .tty .xterm .xterm-accessibility .live-region').innerHTML !== '', {
        polling: 'mutation',
      });
      await expect(await getStderrText(page)).toMatch(/^Completed execution after \d+ms/);
    });

    it('should correctly handle permalinks, showing header and footer when used', async () => {
      await page.goto(baseUrl + '#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiIiwiaGVhZGVyIjoiIyBub3RoaW5nIHRvIHNlZSBoZXJlIiwiZm9vdGVyIjoiIyBvciBoZXJlIn0=');

      const [headerExpand, headerCollapse] = await page.$$('.code-header > button') as ElementHandle<HTMLButtonElement>[],
        [footerExpand, footerCollapse] = await page.$$('.code-footer > button') as ElementHandle<HTMLButtonElement>[];

      expect(await getRawProperty(headerExpand, 'hidden')).toBe(true);
      expect(await getRawProperty(headerCollapse, 'hidden')).toBe(false);
      expect(await getRawProperty(page.$('.header') as Promise<ElementHandle<HTMLDivElement>>, 'hidden')).toBe(false);
      expect(await getCodeHeaderText(page)).toBe('# nothing to see here');
      expect(await getCodeText(page)).toBe('');
      expect(await getRawProperty(footerExpand, 'hidden')).toBe(true);
      expect(await getRawProperty(footerCollapse, 'hidden')).toBe(false);
      expect(await getRawProperty(page.$('.footer') as Promise<ElementHandle<HTMLDivElement>>, 'hidden')).toBe(false);
      expect(await getCodeFooterText(page)).toBe('# or here');
    });

    it('should correctly copy links and markdown when the relevant buttons are pressed', async () => {
      const url = baseUrl + '#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiJF89XCJIZWxsbywgJF8hXCIiLCJhcmdzIjoiLXAiLCJpbnB1dCI6IldvcmxkIn0=';

      await page.goto(url);
      await grantClipboardPermissions(page);

      const copyButton = await page.$(
          'button[name="copy"]'
        ) as ElementHandle<HTMLButtonElement>,
        markdownButton = await page.$(
          'button[name="markdown"]'
        ) as ElementHandle<HTMLButtonElement>;

      await copyButton.click();
      expect(await getRawProperty(copyButton, 'className')).toBe('copied');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Yes, yes, I know...
      expect(await getRawProperty(copyButton, 'className')).toBe('');

      await markdownButton.click();
      expect(await getRawProperty(markdownButton, 'className')).toBe('copied');
      await expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^# \[Perl 5\.28\.1 \(webperl\)] \+ `-p`, 15 bytes\n\n<!-- language-all: lang-perl -->\n\n<pre><code>\$_="Hello, \$_!"<\/code><\/pre>\n\n\[Try it online!\]\[TIO-\w+]\n\n\[Perl 5\.28\.1 \(webperl\)]: https:\/\/www\.perl\.org\/\n\[TIO-\w+]: https?:\/\/[a-z0-9.]+(:\d+)?\/#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiJF89XCJIZWxsbywgJF8hXCIiLCJhcmdzIjoiLXAiLCJpbnB1dCI6IldvcmxkIn0=$/);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Yes, yes, I know...
      expect(await getRawProperty(markdownButton, 'className')).toBe('');
    });
  });
});
