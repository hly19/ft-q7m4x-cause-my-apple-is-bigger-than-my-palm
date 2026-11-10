import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, dayLabel, daysBetween, isValidDate, parseLocalDate, toLocalDate, toLocalTime } from './dates';

describe('local date helpers', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('formats local date and time with padding', () => {
    const d = new Date(2026, 0, 5, 7, 3);
    expect(toLocalDate(d)).toBe('2026-01-05');
    expect(toLocalTime(d)).toBe('07:03');
  });

  it('uses the local day, not UTC, late in the evening', () => {
    // 23:30 local on Mar 1 — toISOString() could already be Mar 2 east of UTC… or west.
    const d = new Date(2026, 2, 1, 23, 30);
    expect(toLocalDate(d)).toBe('2026-03-01');
    const early = new Date(2026, 2, 1, 0, 15);
    expect(toLocalDate(early)).toBe('2026-03-01');
  });

  it('parses YYYY-MM-DD as local midnight', () => {
    const d = parseLocalDate('2026-11-10');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 10, 0]);
    expect(() => parseLocalDate('10/11/2026')).toThrow();
  });

  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-11-10', 0)).toBe('2026-11-10');
  });

  it('adds days across DST changes', () => {
    // EU and US DST transitions in 2026.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('counts days between', () => {
    expect(daysBetween('2026-11-10', '2026-11-10')).toBe(0);
    expect(daysBetween('2026-11-10', '2026-11-17')).toBe(7);
    expect(daysBetween('2026-03-01', '2026-02-28')).toBe(-1);
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
  });

  it('validates dates', () => {
    expect(isValidDate('2026-02-28')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-2-3')).toBe(false);
  });

  it('labels relative days', () => {
    expect(dayLabel('2026-11-10', '2026-11-10')).toBe('Today');
    expect(dayLabel('2026-11-09', '2026-11-10')).toBe('Yesterday');
    expect(dayLabel('2026-11-11', '2026-11-10')).toBe('Tomorrow');
  });
});

describe.each(['Pacific/Auckland', 'America/Los_Angeles', 'Europe/London'])('in %s', (tz) => {
  it('keeps the local day near midnight', async () => {
    const prev = process.env.TZ;
    process.env.TZ = tz;
    try {
      const d = new Date(2026, 5, 15, 23, 59);
      expect(toLocalDate(d)).toBe('2026-06-15');
      expect(addDays('2026-06-15', 1)).toBe('2026-06-16');
    } finally {
      process.env.TZ = prev;
    }
  });
});
