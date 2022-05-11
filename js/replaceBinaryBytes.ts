// Don't replace newlines
export const replaceBinaryBytes = (code: string, replacement: string = '.') =>
  code.replace(/[^\x09\x0a\x20-\x7e]/g, replacement);

export default replaceBinaryBytes;
