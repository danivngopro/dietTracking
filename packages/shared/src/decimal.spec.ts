import { describe, expect, it } from 'vitest';
import { DECIMAL_PATTERN, POSITIVE_DECIMAL_PATTERN } from './decimal';

describe('DECIMAL_PATTERN', () => {
  it.each(['0', '0.5', '1', '100', '0.001', '999.999'])('accepts %s', (v) => {
    expect(DECIMAL_PATTERN.test(v)).toBe(true);
  });

  it.each(['-1', 'abc', '', '1.1234', '1.'])('rejects %s', (v) => {
    expect(DECIMAL_PATTERN.test(v)).toBe(false);
  });
});

describe('POSITIVE_DECIMAL_PATTERN', () => {
  it.each(['0.001', '0.01', '0.1', '0.5', '1', '10', '100', '0.010', '999.999'])(
    'accepts positive value %s',
    (v) => {
      expect(POSITIVE_DECIMAL_PATTERN.test(v)).toBe(true);
    },
  );

  it.each(['0', '0.0', '0.00', '0.000', '-1', '-0.5', 'abc', '', '1.1234'])(
    'rejects zero or invalid value %s',
    (v) => {
      expect(POSITIVE_DECIMAL_PATTERN.test(v)).toBe(false);
    },
  );
});
