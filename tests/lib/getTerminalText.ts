import {Page} from "puppeteer";
import {getRawProperty} from "./getProperties";

export const getTerminalText = async (page: Page, selector: string): Promise<string> => (await getRawProperty(
  page.$<HTMLDivElement>(selector + ' .tty .xterm .xterm-accessibility .live-region'),
  'innerText'
) as string)
  .replace(/\u200b/g, '');

export const getStdoutText = async (page: Page) => getTerminalText(page, '.stdout');

export const getStderrText = async (page: Page) => getTerminalText(page, '.stderr');
