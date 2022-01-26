import { Lang } from '../../Lang';
import 'codemirror/mode/python/python';

export class Python extends Lang {
  constructor() {
    super(
      'pyodide-0.19.0',
      'Python 3',
      (code: number[], input: string, args: string): Worker => {
        const worker = new Worker('dist/js/langs/pyodide-0.19.0/worker.js');

        worker.postMessage({
          type: 'run',
          code,
          args,
          input,
        });

        return worker;
      },
      'https://www.python.org/',
      ['--version'],
      'python'
    );
  }
}

export default Python;
