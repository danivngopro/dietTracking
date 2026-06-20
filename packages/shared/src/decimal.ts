export type DecimalString = string;

export const DECIMAL_PATTERN = /^(0|[1-9]\d*)(\.\d{1,3})?$/;

// Matches a decimal > 0 with up to 3 decimal places. Rejects "0", "0.0", "0.00", "0.000".
export const POSITIVE_DECIMAL_PATTERN = /^(?!0+(?:\.0+)?$)(0|[1-9]\d*)(\.\d{1,3})?$/;

export function isDecimalString(value: string): value is DecimalString {
  return DECIMAL_PATTERN.test(value);
}

export function canonicalDecimal(value: string): DecimalString {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ''] = unsigned.split('.');
  const trimmed = fraction.replace(/0+$/, '');
  const normalized = trimmed ? `${whole}.${trimmed}` : whole;
  return negative && normalized !== '0' ? `-${normalized}` : normalized;
}

