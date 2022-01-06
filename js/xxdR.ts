export const isXxd = (code: string): boolean => /^0{7,8}: /.test(code);

export const xxdR = (code: string): number[] =>
  code
    .trim()
    .replace(/(?<=^|\n)\d{7,8}: (((.{2}){1,2} ){1,8}).+/g, '$1')
    .replace(/\s+/g, '')
    .match(/../g)
    .map((c) => parseInt(c, 16));

export default xxdR;
