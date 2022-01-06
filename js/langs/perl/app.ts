import { addLang } from '../../langs';
import 'codemirror/mode/perl/perl';

const runner = (code: number[], input: string, args: string): Worker => {
  const worker = new Worker('js/langs/perl/worker.js');

  worker.postMessage({
    type: 'run',
    code,
    args,
    input,
  });

  return worker;
};

addLang('perl', {
  name: 'Perl 5',
  url: 'https://www.perl.org/',
  runner,
});
