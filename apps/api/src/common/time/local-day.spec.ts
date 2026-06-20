import { localDayUtcRange } from './local-day';

describe('localDayUtcRange', () => {
  it('uses DST-aware Jerusalem boundaries', () => {
    const range = localDayUtcRange('2026-03-27', 'Asia/Jerusalem');
    expect((range.end.getTime() - range.start.getTime()) / 3_600_000).toBe(23);
  });

  it('rejects invalid zones', () => {
    expect(() => localDayUtcRange('2026-06-20', 'Not/AZone')).toThrow('Invalid timezone or date');
  });
});
