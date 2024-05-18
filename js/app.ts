import Base64 from './Decoders/Base64';
import Bash from './langs/bash-wasmer/Bash';
import Default from './Decoders/Default';
import Hexdump from './Decoders/Hexdump';
import JavaScript from './langs/javascript-browser/JavaScript';
import Ruby from './langs/ruby-wasmer/Ruby';
import Perl from './langs/webperl-5.28.1/Perl';
// import Python from './langs/python-wasmer/Python';
import UI from './UI';
import Xxd from './Decoders/Xxd';
import jq from './langs/jq-wasmer/jq';
import { decoders } from './Decoders';
import { langs } from './Langs';

decoders.register(new Xxd(), new Hexdump(), new Base64(), new Default());
langs.register(
  new Bash(),
  new JavaScript(),
  new Ruby(),
  new Perl(),
  // TODO: This is 120MiB which can't currently be cached by the browser by default, making it kinda useless :(
  //  Need a smaller image from Wasmer, or could download the data manually on first use and store in IndexedDB:
  //    https://stackoverflow.com/a/71581910/3145856
  // new Python(),
  new jq()
);

const ui = new UI();
