import { Lang } from '../../Lang';
import 'codemirror/mode/ruby/ruby';
import { defaultRunner } from '../../Langs';

export class Ruby extends Lang {
  constructor() {
    super(
      'runrb-ruby-2.6.1',
      'Ruby 2.6.1',
      defaultRunner('dist/js/langs/runrb-ruby-2.6.1/worker.js'),
      'https://www.ruby-lang.org/',
      ['-p', '-n', '--version'],
      'ruby'
    );
  }
}

export default Ruby;
