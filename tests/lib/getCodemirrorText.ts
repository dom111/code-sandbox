import {Page} from "puppeteer";
import {getRawProperty} from "./getProperties";

export const getCodemirrorText = async (page: Page, selector: string): Promise<string> => (await getRawProperty(
  page.$<HTMLDivElement>(selector + ' .CodeMirror-code'),
  'innerText'
) as string)
  .replace(/\u200b/g, '');

export const getCodeHeaderText = async (page: Page) => getCodemirrorText(page, '.header');
export const getCodeText = async (page: Page) => getCodemirrorText(page, '.code');
export const getCodeFooterText = async (page: Page) => getCodemirrorText(page, '.footer');
export const getStdinText = async (page: Page) => getCodemirrorText(page, '.stdin');
