import Hexdump from '../../../js/Decoders/Hexdump';
import { hexdump } from '../../lib/decoderExamples';

const { oneNullByte, allBytes } = hexdump;

test('Xxd data is converted as expected', () => {
  const hexdump = new Hexdump();

  expect(hexdump.name()).toBe('hexdump');
  expect(hexdump.matchesAsString('')).toBe(false);
  expect(hexdump.matchesAsString(oneNullByte)).toBe(true);
  expect(hexdump.matchesAsString(allBytes)).toBe(true);
  expect(hexdump.decodeAsString(oneNullByte)).toMatchObject([0]);
  expect(hexdump.decodeAsString(allBytes)).toMatchObject(
    new Array(256).fill(0).map((_, i) => i)
  );
});
