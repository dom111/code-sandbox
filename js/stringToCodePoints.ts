export const stringToCodePoints = (code: string): number[] =>
  code.split('').map((c: string): number => c.charCodeAt(0));

export default stringToCodePoints;
