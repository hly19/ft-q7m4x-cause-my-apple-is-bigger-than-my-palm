import { useMemo } from 'react';
import type { FoodEntry } from '../db/types';

export interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumEntries(entries: FoodEntry[]): Totals {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const e of entries) {
    t.kcal += e.kcal * e.portion;
    t.protein += (e.protein ?? 0) * e.portion;
    t.carbs += (e.carbs ?? 0) * e.portion;
    t.fat += (e.fat ?? 0) * e.portion;
  }
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) };
}

export function useTotals(entries: FoodEntry[]): Totals {
  return useMemo(() => sumEntries(entries), [entries]);
}
