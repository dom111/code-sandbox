// Don't replace newlines
export const replaceBinaryBytes = (code: string, replacement: string = '.') =>
  code.replace(/[\x00-\x09\x0b-\x1f\x7f-\xff]/g, replacement);

export default replaceBinaryBytes;
