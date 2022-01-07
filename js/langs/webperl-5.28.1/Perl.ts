import { Lang } from '../../Lang';
import 'codemirror/mode/perl/perl';

export class Perl extends Lang {
  constructor() {
    super(
      'webperl-5.28.1',
      'Perl 5.28.1 (webperl)',
      (code: number[], input: string, args: string): Worker => {
        const worker = new Worker('dist/js/langs/webperl-5.28.1/worker.js');

        worker.postMessage({
          type: 'run',
          code,
          args,
          input,
        });

        return worker;
      },
      'https://www.perl.org/',
      ['-M5.10.0', '-F', '-l', '-p'],
      'perl'
    );
  }
}

export default Perl;
