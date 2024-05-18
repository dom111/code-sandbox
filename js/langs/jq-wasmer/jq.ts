import { Lang } from '../../Lang';
import { wasmerRunner } from '../../Langs';
import 'codemirror/mode/python/python';
import Runner from '../../Runner';
import Wasmer from '../../Runners/Wasmer';

export class jq extends Lang {
  constructor() {
    super(
      'jq-wasmer',
      'jq (wasmer)',
      async (code: number[], input: string, args: string): Promise<Runner> => {
        const runner = new Wasmer('syrusakbary/jq', false, {
          mount: {
            "/app": {
              "input.json": input
            }
          }
        });

        runner.init(
          code,
          '',
          (args.length ? (args + '\n') : '') +
          '$code\n' +
          '/app/input.json'
        );

        return runner;
      },
      'https://jqlang.github.io/jq/',
      [],
      'jq'
    );
  }
}

export default jq;
