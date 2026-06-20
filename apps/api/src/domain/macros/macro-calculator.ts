import Decimal from 'decimal.js';
import type { MacroValues } from '@diet/shared';
import { canonicalDecimal } from '@diet/shared';

Decimal.set({ precision: 24, rounding: Decimal.ROUND_HALF_UP });

const keys = ['calories', 'protein', 'carbs', 'fat'] as const;

function output(value: Decimal.Value): string {
  return canonicalDecimal(new Decimal(value).toDecimalPlaces(3).toFixed(3));
}

export function multiplyMacros(macros: MacroValues, quantity: Decimal.Value): MacroValues {
  return Object.fromEntries(keys.map((key) => [key, output(new Decimal(macros[key]).times(quantity))])) as unknown as MacroValues;
}

export function sumMacros(values: MacroValues[]): MacroValues {
  return Object.fromEntries(keys.map((key) => [key, output(values.reduce((sum, value) => sum.plus(value[key]), new Decimal(0)))])) as unknown as MacroValues;
}

export const zeroMacros = (): MacroValues => ({ calories: '0', protein: '0', carbs: '0', fat: '0' });
export const serializeDecimal = (value: Decimal.Value): string => output(value);

