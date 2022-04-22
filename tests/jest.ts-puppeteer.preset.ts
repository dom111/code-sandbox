const { jsWithTs } = require('ts-jest/presets');
const jestPuppeteerPreset = require('jest-puppeteer/jest-preset.js');

module.exports = {
  ...jsWithTs,
  ...jestPuppeteerPreset,
};
