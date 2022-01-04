export const isXxd = (code) => code.match(/^0{8}: /);

export const xxdR = (code) =>
  code
    .replace(/(?<=^|\n)\d{8}: (((.{2}){1,2} ){1,8}).+/g, '$1')
    .replace(/\s+/g, '')
    .match(/../g)
    .map((c) => parseInt(c, 16));

export default xxdR;
