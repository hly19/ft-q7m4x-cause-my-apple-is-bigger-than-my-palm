import { describe, expect, it } from 'vitest';
import type { DayLog, FoodEntry } from '../db/types';
import { dailySeries, weekStart, weeklyAverages } from './stats';

const e = (date: string, kcal: number, protein = 0, portion = 1) =>
  ({ date, time: '12:00', name: 'x', kcal, protein, portion, uuid: date + kcal, updatedAt: '' }) as FoodEntry;

describe('stats', () => {
  it('finds Monday week starts', () => {
    expect(weekStart('2026-11-10')).toBe('2026-11-09'); // Tue → Mon
    expect(weekStart('2026-11-09')).toBe('2026-11-09');
    expect(weekStart('2026-11-15')).toBe('2026-11-09'); // Sun → Mon
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });

  it('builds a gap-aware daily series', () => {
    const s = dailySeries(
      [e('2026-11-09', 500, 30), e('2026-11-09', 300, 10, 2), e('2026-11-11', 1800, 100)],
      [{ date: '2026-11-10', steps: 9000 } as DayLog],
      '2026-11-09',
      '2026-11-11',
    );
    expect(s).toEqual([
      { date: '2026-11-09', kcal: 1100, protein: 50, steps: null },
      { date: '2026-11-10', kcal: null, protein: null, steps: 9000 },
      { date: '2026-11-11', kcal: 1800, protein: 100, steps: null },
    ]);
  });

  it('averages only logged days per week', () => {
    const s = dailySeries([e('2026-11-09', 2000), e('2026-11-10', 1600), e('2026-11-16', 1800)], [], '2026-11-09', '2026-11-17');
    const w = weeklyAverages(s);
    expect(w[0]).toMatchObject({ weekStart: '2026-11-16', daysLogged: 1, kcal: 1800 });
    expect(w[1]).toMatchObject({ weekStart: '2026-11-09', daysLogged: 2, kcal: 1800, steps: null });
  });
});
