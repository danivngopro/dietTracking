import { describe, expect, it } from 'vitest';
import { canonicalDecimal, isDecimalString } from './decimal';

describe('canonicalDecimal', () => {
  it.each([
    ['165.000', '165'],
    ['0.500', '0.5'],
    ['3.625', '3.625'],
    ['-0.000', '0'],
  ])('serializes %s as %s', (input, expected) => {
    expect(canonicalDecimal(input)).toBe(expected);
  });
});

describe('isDecimalString', () => {
  it('accepts non-negative values with up to three decimal places', () => {
    expect(isDecimalString('12.345')).toBe(true);
    expect(isDecimalString('12.3456')).toBe(false);
    expect(isDecimalString('-1')).toBe(false);
  });
});
