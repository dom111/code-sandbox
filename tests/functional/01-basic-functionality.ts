import {getRawProperties, getRawProperty} from '../lib/getProperties';
import {getStderrText, getStdoutText} from "../lib/getTerminalText";
import {getCodeFooterText, getCodeHeaderText, getCodeText, getStdinText} from "../lib/getCodemirrorText";
import {grantClipboardPermissions} from "../lib/grantClipboardPermissions";

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

          const [expand, collapse] = await page.$$<HTMLButtonElement>(buttonSelector),
            element = await page.$(elementSelector);

          await Promise.all([expand, collapse, element]
            .map(async (handle) => expect(handle).not.toBeUndefined()));

          await expect(await getRawProperty(expand, 'hidden')).toBe(false);
          await expect(await getRawProperty(collapse, 'hidden')).toBe(true);
          await expect(await getRawProperty(element, 'hidden')).toBe(true);

          await expand.click();

          await expect(await getRawProperty(expand, 'hidden')).toBe(true);
          await expect(await getRawProperty(collapse, 'hidden')).toBe(false);
          await expect(await getRawProperty(element, 'hidden')).toBe(false);

          await collapse.click();

          await expect(await getRawProperty(expand, 'hidden')).toBe(false);
          await expect(await getRawProperty(collapse, 'hidden')).toBe(true);
          await expect(await getRawProperty(element, 'hidden')).toBe(true);
        })
      );

    it('should be possible to change the language', async () => {
      await page.goto(baseUrl);

      const languageSelector = await page.$<HTMLSelectElement>(
        'select[name="lang"]'
      );

      await expect(languageSelector).not.toBeNull();

      const options = await getRawProperties<HTMLOptionElement>(
        languageSelector.$$<HTMLOptionElement>('option'),
        'value'
      );

      await expect(await getRawProperty<HTMLSelectElement>(
        languageSelector,
        'selectedIndex'
      )).toBe(0);
      await expect(options).toMatchObject([
        'javascript-browser',
        'webperl-5.28.1',
      ]);
      await languageSelector.select('webperl-5.28.1');

      const argsText = await getRawProperties<HTMLButtonElement>(
        page.$$<HTMLButtonElement>('.args-wrapper .actions button'),
        'innerText'
      );

      await expect(argsText).toMatchObject([ '-M5.10.0', '-F', '-l', '-p' ]);
    });

    it('should correctly handle permalinks, running the code and displaying the output', async () => {
      await page.goto(baseUrl + '#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiJF89XCJIZWxsbywgJF8hXCIiLCJhcmdzIjoiLXAiLCJpbnB1dCI6IldvcmxkIn0=');

      const languageSelector = await page.$<HTMLSelectElement>(
          'select[name="lang"]'
        ),
        runButton = await page.$<HTMLButtonElement>(
          'button[name="run"]'
        ),
        stopButton = await page.$<HTMLButtonElement>(
          'button[name="stop"]'
        );

      await expect(languageSelector).not.toBeNull();
      await expect(runButton).not.toBeNull();
      await expect(stopButton).not.toBeNull();
      await expect(await getRawProperty<HTMLSelectElement>(
        languageSelector,
        'selectedIndex'
      )).toBe(1);
      await expect(await getRawProperty(runButton, 'disabled')).toBe(true);
      await expect(await getRawProperty(stopButton, 'disabled')).toBe(false);

      // wait for the run to finish
      await page.waitForFunction(() => document.querySelector('button[name="run"]:not([disabled])'), {
        polling: 'mutation',
      });
      await expect(await getRawProperty(runButton, 'disabled')).toBe(false);
      await expect(await getRawProperty(stopButton, 'disabled')).toBe(true);
      await expect(await getRawProperty(page.$<HTMLDivElement>('.header'), 'hidden')).toBe(true);
      await expect(await getCodeHeaderText(page)).toBe('');
      await expect(await getCodeText(page)).toBe('$_="Hello, $_!"');
      await expect(await getRawProperty(page.$<HTMLDivElement>('.footer'), 'hidden')).toBe(true);
      await expect(await getCodeFooterText(page)).toBe('');
      await expect(await getStdinText(page)).toBe('World');
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

      const [headerExpand, headerCollapse] = await page.$$<HTMLButtonElement>('.code-header > button'),
        [footerExpand, footerCollapse] = await page.$$<HTMLButtonElement>('.code-footer > button');

      await expect(await getRawProperty(headerExpand, 'hidden')).toBe(true);
      await expect(await getRawProperty(headerCollapse, 'hidden')).toBe(false);
      await expect(await getRawProperty(page.$<HTMLDivElement>('.header'), 'hidden')).toBe(false);
      await expect(await getCodeHeaderText(page)).toBe('# nothing to see here');
      await expect(await getCodeText(page)).toBe('');
      await expect(await getRawProperty(footerExpand, 'hidden')).toBe(true);
      await expect(await getRawProperty(footerCollapse, 'hidden')).toBe(false);
      await expect(await getRawProperty(page.$<HTMLDivElement>('.footer'), 'hidden')).toBe(false);
      await expect(await getCodeFooterText(page)).toBe('# or here');
    });

    it('should correctly copy links and markdown when the relevant buttons are pressed', async () => {
      const url = baseUrl + '#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiJF89XCJIZWxsbywgJF8hXCIiLCJhcmdzIjoiLXAiLCJpbnB1dCI6IldvcmxkIn0=';

      await page.goto(url);
      await grantClipboardPermissions(page);

      const copyButton = await page.$<HTMLButtonElement>(
          'button[name="copy"]'
        ),
        markdownButton = await page.$<HTMLButtonElement>(
          'button[name="markdown"]'
        );

      await copyButton.click();
      await expect(await getRawProperty(copyButton, 'className')).toBe('copied');
      await expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
      await page.waitForTimeout(1000);
      await expect(await getRawProperty(copyButton, 'className')).toBe('');

      await markdownButton.click();
      await expect(await getRawProperty(markdownButton, 'className')).toBe('copied');
      await expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^# \[Perl 5\.28\.1 \(webperl\)] \+ `-p`, 15 bytes\n\n<!-- language-all: lang-perl -->\n\n<pre><code>\$_="Hello, \$_!"<\/code><\/pre>\n\n\[Try it online!\]\[TIO-\w+]\n\n\[Perl 5\.28\.1 \(webperl\)]: https:\/\/www\.perl\.org\/\n\[TIO-\w+]: https?:\/\/[a-z0-9.]+(:\d+)?\/#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiJF89XCJIZWxsbywgJF8hXCIiLCJhcmdzIjoiLXAiLCJpbnB1dCI6IldvcmxkIn0=$/);
      await page.waitForTimeout(1000);
      await expect(await getRawProperty(markdownButton, 'className')).toBe('');
    });
  });
});
