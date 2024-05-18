import { Lang } from '../../Lang';
import { wasmerRunner } from '../../Langs';
import 'codemirror/mode/python/python';

export class Python extends Lang {
  constructor() {
    super(
      'python-wasmer',
      'Python (wasmer)',
      wasmerRunner('python/python', 'script.py'),
      'https://www.python.org/',
      [],
      'python'
    );
  }
}

export default Python;
