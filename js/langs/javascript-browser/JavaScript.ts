import { Lang } from '../../Lang';
import 'codemirror/mode/javascript/javascript';

export class JavaScript extends Lang {
  constructor() {
    super(
      'javascript-browser',
      'JavaScript (Browser)',
      (code: number[], input: string, args: string): Worker => {
        const worker = new Worker('dist/js/langs/javascript-browser/worker.js');

        worker.postMessage({
          type: 'run',
          code,
          args,
          input,
        });

        return worker;
      },
      'https://www.ecma-international.org/publications-and-standards/standards/ecma-262/',
      null,
      'javascript'
    );
  }
}

export default JavaScript;
