import Base64 from './Decoders/Base64';
import Default from './Decoders/Default';
import Hexdump from './Decoders/Hexdump';
import JavaScript from './langs/javascript-browser/JavaScript';
import PHP from './langs/pib-7.4/PHP';
import Perl from './langs/webperl-5.28.1/Perl';
import UI from './UI';
import Xxd from './Decoders/Xxd';
import { decoders } from './Decoders';
import { langs } from './Langs';

decoders.register(new Xxd(), new Hexdump(), new Base64(), new Default());
langs.register(new JavaScript(), new PHP(), new Perl());

const ui = new UI();
