import { multiplyMacros, sumMacros } from './macro-calculator';

describe('macro calculator', () => {
  it('multiplies and rounds macros using decimal arithmetic', () => {
    expect(multiplyMacros({ calories: '165', protein: '31', carbs: '0', fat: '3.6' }, '1.5')).toEqual({
      calories: '247.5', protein: '46.5', carbs: '0', fat: '5.4',
    });
  });

  it('sums macro values without floating point drift', () => {
    expect(sumMacros([
      { calories: '0.1', protein: '0.1', carbs: '0.1', fat: '0.1' },
      { calories: '0.2', protein: '0.2', carbs: '0.2', fat: '0.2' },
    ])).toEqual({ calories: '0.3', protein: '0.3', carbs: '0.3', fat: '0.3' });
  });
});

