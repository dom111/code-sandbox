import { Lang } from '../../Lang';
import { defaultRunner } from '../../Langs';
import 'codemirror/mode/javascript/javascript';

export class JavaScript extends Lang {
  constructor() {
    super(
      'javascript-browser',
      'JavaScript (Browser)',
      defaultRunner('dist/js/langs/javascript-browser/worker.js'),
      'https://www.ecma-international.org/publications-and-standards/standards/ecma-262/',
      null,
      'javascript'
    );
  }
}

export default JavaScript;
