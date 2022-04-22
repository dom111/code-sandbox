import Xxd from '../../../js/Decoders/Xxd';
import { xxd } from '../../lib/decoderExamples';

const { oneNullByte, allBytes } = xxd;

test('Xxd data is converted as expected', () => {
  const xxd = new Xxd();

  expect(xxd.name()).toBe('xxd');
  expect(xxd.matchesAsString('')).toBe(false);
  expect(xxd.matchesAsString(oneNullByte)).toBe(true);
  expect(xxd.matchesAsString(allBytes)).toBe(true);
  expect(xxd.decodeAsString(oneNullByte)).toMatchObject([0]);
  expect(xxd.decodeAsString(allBytes)).toMatchObject(
    new Array(256).fill(0).map((_, i) => i)
  );
});
