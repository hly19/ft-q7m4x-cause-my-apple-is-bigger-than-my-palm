import type { DayLog, FoodEntry } from '../db/types';
import { sumEntries } from '../hooks/useTotals';
import { addDays, daysBetween, parseLocalDate } from './dates';

export interface DayPoint {
  date: string;
  kcal: number | null;    // null = nothing logged (a gap, not zero)
  protein: number | null;
  steps: number | null;
}

/** One point per calendar day from `from` to `to` inclusive. */
export function dailySeries(entries: FoodEntry[], days: DayLog[], from: string, to: string): DayPoint[] {
  const byDate = new Map<string, FoodEntry[]>();
  for (const e of entries) (byDate.get(e.date) ?? byDate.set(e.date, []).get(e.date)!).push(e);
  const steps = new Map(days.filter((d) => d.steps != null).map((d) => [d.date, d.steps!]));
  const out: DayPoint[] = [];
  for (let d = from; daysBetween(d, to) >= 0; d = addDays(d, 1)) {
    const es = byDate.get(d);
    const t = es ? sumEntries(es) : null;
    out.push({ date: d, kcal: t?.kcal ?? null, protein: t?.protein ?? null, steps: steps.get(d) ?? null });
  }
  return out;
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const dow = (parseLocalDate(date).getDay() + 6) % 7; // Mon=0
  return addDays(date, -dow);
}

export interface WeekAvg {
  weekStart: string;
  daysLogged: number;
  kcal: number | null;
  protein: number | null;
  steps: number | null;
}

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};

/** Averages per Monday-start week, newest first. Only days with data count. */
export function weeklyAverages(points: DayPoint[]): WeekAvg[] {
  const weeks = new Map<string, DayPoint[]>();
  for (const p of points) {
    const w = weekStart(p.date);
    (weeks.get(w) ?? weeks.set(w, []).get(w)!).push(p);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([w, ps]) => ({
      weekStart: w,
      daysLogged: ps.filter((p) => p.kcal != null).length,
      kcal: avg(ps.map((p) => p.kcal)),
      protein: avg(ps.map((p) => p.protein)),
      steps: avg(ps.map((p) => p.steps)),
    }));
}
