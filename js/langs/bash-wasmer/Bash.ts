import { Lang } from '../../Lang';
import { wasmerRunner } from '../../Langs';
import 'codemirror/mode/shell/shell';

export class Bash extends Lang {
  constructor() {
    super(
      'bash-wasmer',
      'Bash (wasmer)',
      wasmerRunner('sharrattj/bash', 'script.sh'),
      'https://www.gnu.org/software/bash/',
      [],
      'shell'
    );
  }
}

export default Bash;
