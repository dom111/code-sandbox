export const codePointsToString = (code: number[]): string =>
  code.reduce((code, ord) => code + String.fromCharCode(ord), '');

export default codePointsToString;
