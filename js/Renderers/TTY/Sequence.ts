type PositionCalculator = (
  input: string,
  x: number,
  y: number,
  cols: number
) => [number, number];

const strip = (
  input: string,
  chars: string | string[],
  leading: boolean = true,
  trailing: boolean = true
): string => {
  if (!Array.isArray(chars)) {
    chars = Array.from(chars);
  }

  if (leading) {
    while (chars.includes(input[0])) {
      input = input.slice(1);
    }
  }

  if (trailing) {
    while (chars.includes(input[input.length - 1])) {
      input = input.slice(0, -1);
    }
  }

  return input;
};

export class Sequence {
  private calculator: PositionCalculator;
  public matcher: RegExp;

  constructor(
    calculator: PositionCalculator = (input, x, y) => [x + input.length, y],
    matcher: RegExp = /./
  ) {
    this.calculator = calculator;
    this.matcher = matcher;
  }

  public calculatePosition(
    input: string,
    x: number,
    y: number,
    cols: number
  ): [number, number] {
    return this.calculator(input, x, y, cols);
  }

  public capture(input: string): [string, string] {
    const match = input.match(this.matcher);

    if (!match) {
      throw new TypeError(`Input string doesn't match.`);
    }

    return [input.slice(match[0].length), match[0]];
  }

  public matches(input: string): boolean {
    return this.matcher.test(input);
  }

  public matchesExact(input: string): boolean {
    return new RegExp('^' + this.matcher.source + '$').test(input);
  }

  public matchesPartial(input: string): boolean {
    // Break down the RegExp into its basic components. This is reasonably basic, but works for the patterns in TTY.ts
    const parts = this.matcher.source.match(
        // /(\\(c[A-Z]|[bBdDfnrsStvwW0]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4,5}|[[\]{}.+*?|^$()/])|(?<=[^\\])\[[^\]]+]|[\s\S])([?+*]|{\d+,?\d*}|{,\d+})*/g
        /(\\(c[A-Z]|[bBdDfnrsStvwW0]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4,5}|[[\]{}.+*?|^$()/])|(?<=[^\\])\[.+?(?<!\\)(\\\\)*]|[\s\S])([?+*]|{\d+,?\d*}|{,\d+})*/g
      ),
      closeParentheses = (regex: string) => {
        const [n] = Array.from(regex).reduce(
          ([n, processed], c) => {
            const isEscaped = /(?<!\\)\\(\\\\)*$/.test(processed);

            if (c === '(' && !isEscaped) {
              n++;
            }

            if (c === ')' && !isEscaped) {
              n--;
            }

            return [n, processed + c];
          },
          [0, '']
        );

        return regex + ')'.repeat(n);
      },
      [matcher] = parts.reduce(
        ([matcher, processed], expression) => [
          matcher +
            '|' +
            strip(
              closeParentheses(strip(processed + expression, '(', false)),
              '|'
            ),
          processed + expression,
        ],
        ['', '']
      );

    return new RegExp('^(' + matcher.slice(1) + ')$').test(input);
  }

  public matchesStart(input: string): boolean {
    return new RegExp('^(' + this.matcher.source + ')').test(input);
  }
}

export default Sequence;
