import {getRawProperty} from "../lib/getProperties";
import {grantClipboardPermissions} from "../lib/grantClipboardPermissions";

const baseUrl = process.env.BASE_URL ?? 'http://localhost:8000/';

describe('Code Sandbox', () => {
  describe('decoders', () => {
    it('should correct parse an `xxd` encoded program', async () => {
      await page.goto(baseUrl);
      await grantClipboardPermissions(page);

      const codeInput = await page.$<HTMLTextAreaElement>('.code .CodeMirror textarea'),
        byteCount = await page.$<HTMLSpanElement>('.byte-count'),
        encoded = await page.$<HTMLSpanElement>('.encoded'),
        markdown = await page.$<HTMLButtonElement>('button[name="markdown"]'),
        languageSelector = await page.$<HTMLSelectElement>(
          'select[name="lang"]'
        );

      await languageSelector.select('webperl-5.28.1');
      await expect(await getRawProperty(encoded, 'hidden')).toBe(true);
      await page.evaluate((data) => navigator.clipboard.writeText(data), `00000000: 7072 696e 7422 4865 6c6c 6f2c 2057 6f72  print"Hello, Wor
00000010: 6c64 2122                                ld!"`)
      await codeInput.focus();
      await page.keyboard.down('Control');
      await page.keyboard.down('v');
      await page.keyboard.up('v');
      await page.keyboard.up('Control');
      await expect(await getRawProperty(byteCount, 'innerText')).toBe('20');
      await expect(await getRawProperty(encoded, 'hidden')).toBe(false);
      await expect(await getRawProperty(encoded, 'innerText')).toBe('(xxd)');
      await markdown.click();
      await expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/# \[Perl 5\.28\.1 \(webperl\)], 20 bytes\n\n<!-- language-all: lang-perl -->\n\n<pre><code>print"Hello, World!"<\/code><\/pre>\n\n\[Try it online!]\[TIO-\w+]\n\n\[Perl 5\.28\.1 \(webperl\)]: https:\/\/www\.perl\.org\/\n\[TIO-\w+]: https?:\/\/[a-z0-9.]+(:\d+)?\/#eyJsYW5nIjoid2VicGVybC01LjI4LjEiLCJjb2RlIjoiMDAwMDAwMDA6IDcwNzIgNjk2ZSA3NDIyIDQ4NjUgNmM2YyA2ZjJjIDIwNTcgNmY3MiAgcHJpbnRcIkhlbGxvLCBXb3JcbjAwMDAwMDEwOiA2YzY0IDIxMjIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxkIVwiIn0=/)
    });
  });
});