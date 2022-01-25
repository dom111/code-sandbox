import { Lang } from '../../Lang';
import 'codemirror/mode/php/php';

export class PHP extends Lang {
  constructor() {
    super(
      'pib-7.4',
      'PHP 7.4 (pib)',
      (code: number[], input: string, args: string): Worker => {
        const worker = new Worker('dist/js/langs/pib-7.4/worker.js');

        worker.postMessage({
          type: 'run',
          code,
          args,
          input,
        });

        return worker;
      },
      'https://www.php.net/',
      ['-r', '-R', '-l', '-p'],
      'php'
    );
  }
}

export default PHP;
