import Base64 from './Decoders/Base64';
import Default from './Decoders/Default';
import JavaScript from './langs/javascript-browser/JavaScript';
import Perl from './langs/webperl-5.28.1/Perl';
import UI from './UI';
import Xxd from './Decoders/Xxd';
import { decoders } from './Decoders';
import { langs } from './Langs';

decoders.register(new Xxd(), new Base64(), new Default());
langs.register(new JavaScript(), new Perl());

const ui = new UI();
