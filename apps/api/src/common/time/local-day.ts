import { DateTime } from 'luxon';

export function isValidZone(zone: string): boolean {
  return DateTime.local().setZone(zone).isValid;
}

export function localDayUtcRange(date: string, zone: string) {
  const start = DateTime.fromISO(date, { zone }).startOf('day');
  if (!start.isValid || start.toISODate() !== date) throw new Error('Invalid timezone or date');
  return { start: start.toUTC().toJSDate(), end: start.plus({ days: 1 }).toUTC().toJSDate() };
}

