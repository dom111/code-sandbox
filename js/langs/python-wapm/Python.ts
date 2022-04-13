import { Lang } from '../../Lang';
import { defaultRunner } from '../../Langs';
import 'codemirror/mode/python/python';

export class Python extends Lang {
  constructor() {
    super(
      'python-0.1.0-wapm',
      'Python 3.6.7 (wapm)',
      defaultRunner('dist/js/langs/python-wapm/worker.js'),
      'https://www.python.org/',
      [],
      'python'
    );
  }
}

export default Python;
