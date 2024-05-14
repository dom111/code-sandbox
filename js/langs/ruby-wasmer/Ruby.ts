import { Lang } from '../../Lang';
import { wasmerRunner } from '../../Langs';
import 'codemirror/mode/ruby/ruby';

export class Ruby extends Lang {
  constructor() {
    super(
      'ruby-wasmer',
      'Ruby (wasmer)',
      wasmerRunner('katei/ruby', 'script.rb'),
      // wasmerRunner('madao/ruby-wasm', 'script.rb'),
      'https://www.ruby-lang.org/',
      [],
      'ruby'
    );
  }
}

export default Ruby;
