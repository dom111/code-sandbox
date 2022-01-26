import Base64 from './Decoders/Base64';
import Default from './Decoders/Default';
import Hexdump from './Decoders/Hexdump';
import JavaScript from './langs/javascript-browser/JavaScript';
import Perl from './langs/webperl-5.28.1/Perl';
import Python from './langs/pyodide-0.19.0/Python';
import UI from './UI';
import Xxd from './Decoders/Xxd';
import { decoders } from './Decoders';
import { langs } from './Langs';

decoders.register(new Xxd(), new Hexdump(), new Base64(), new Default());
langs.register(new JavaScript(), new Perl(), new Python());

const ui = new UI();
