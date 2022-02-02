import { Lang } from '../../Lang';
import { defaultRunner } from '../../Langs';
import 'codemirror/mode/perl/perl';

export class Perl extends Lang {
  constructor() {
    super(
      'webperl-5.28.1',
      'Perl 5.28.1 (webperl)',
      defaultRunner('dist/js/langs/webperl-5.28.1/worker.js'),
      'https://www.perl.org/',
      ['-M5.10.0', '-F', '-l', '-p'],
      'perl'
    );
  }
}

export default Perl;
