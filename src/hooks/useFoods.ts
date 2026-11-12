import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db/db';
import type { UserFood } from '../db/types';
import { COMMON_KEYS, FOODS, type FoodDef } from '../data/foods';

/** User foods are stored per ONE unit; expose them as a FoodDef with a 100 g unit so the same math applies. */
export function userFoodToDef(u: UserFood): FoodDef {
  return {
    key: `u:${u.uuid}`,
    name: u.name,
    category: u.category ?? 'mixed',
    per100g: { kcal: u.kcal, protein: u.protein ?? 0, carbs: u.carbs ?? 0, fat: u.fat ?? 0 },
    units: [{ unit: 'piece', grams: 100, label: u.unitLabel || 'serving' }],
  };
}

export interface FoodLibrary {
  all: FoodDef[];
  byKey: Map<string, FoodDef>;
  suggestions: FoodDef[]; // recent first, then common
  userFoods: UserFood[];
}

export function useFoods(): FoodLibrary {
  const data = useLiveQuery(async () => {
    const [userFoods, recent] = await Promise.all([
      db.foods.toArray(),
      db.foodEntries.orderBy('id').reverse().limit(150).toArray(),
    ]);
    const counts = new Map<string, number>();
    for (const e of recent) for (const it of e.items ?? []) counts.set(it.foodKey, (counts.get(it.foodKey) ?? 0) + 1);
    const recentKeys = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { userFoods, recentKeys };
  }, []);

  return useMemo(() => {
    const userFoods = data?.userFoods ?? [];
    const all = [...userFoods.map(userFoodToDef), ...FOODS];
    const byKey = new Map(all.map((f) => [f.key, f]));
    const keys = [...new Set([...(data?.recentKeys ?? []), ...COMMON_KEYS])];
    const suggestions = keys.map((k) => byKey.get(k)).filter((f): f is FoodDef => !!f).slice(0, 12);
    return { all, byKey, suggestions, userFoods };
  }, [data]);
}
