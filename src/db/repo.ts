// All writes go through here so totals, useCount, tombstones and undo stay consistent.
import { db, nowIso } from './db';
import type { DayLog, FoodEntry, LoggedItem, Meal, New, Settings, SyncTable, UserFood } from './types';
import { nowTime, today } from '../utils/dates';

export const DEFAULT_SETTINGS: New<Settings> = { key: 'main', units: 'metric', stepTarget: 10000 };

export async function ensureSettings(): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    if (!(await db.settings.get('main'))) await db.settings.add(DEFAULT_SETTINGS as Settings);
  });
}

export async function updateSettings(changes: Partial<Omit<Settings, 'key'>>): Promise<void> {
  await ensureSettings();
  await db.settings.update('main', changes);
}

/** Log a saved meal. Returns an undo function. */
export async function logMeal(meal: Meal, date: string, portion = 1): Promise<() => Promise<void>> {
  const prev = { useCount: meal.useCount, lastUsed: meal.lastUsed };
  const id = await db.transaction('rw', db.foodEntries, db.meals, async () => {
    const entryId = (await db.foodEntries.add({
      date,
      time: date === today() ? nowTime() : '12:00',
      mealId: meal.id,
      name: meal.name,
      kcal: meal.kcal,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      portion,
      items: meal.items,
    } as FoodEntry)) as number;
    await db.meals.update(meal.id!, { useCount: meal.useCount + 1, lastUsed: today() });
    return entryId;
  });
  return async () => {
    await db.transaction('rw', db.foodEntries, db.meals, db.tombstones, async () => {
      await removeWithTombstone('foodEntries', id);
      await db.meals.update(meal.id!, prev);
    });
  };
}

export interface CustomFood {
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  items?: LoggedItem[];
  saveAsMeal?: boolean;
}

/** Log a one-off food, optionally saving it as a meal. Returns an undo function. */
export async function logCustom(food: CustomFood, date: string): Promise<() => Promise<void>> {
  const { entryId, mealId } = await db.transaction('rw', db.foodEntries, db.meals, async () => {
    let mealId: number | undefined;
    if (food.saveAsMeal) {
      mealId = (await db.meals.add({
        name: food.name,
        kcal: food.kcal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        items: food.items,
        useCount: 1,
        lastUsed: today(),
      } as Meal)) as number;
    }
    const entryId = (await db.foodEntries.add({
      date,
      time: date === today() ? nowTime() : '12:00',
      mealId,
      name: food.name,
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      items: food.items,
      portion: 1,
    } as FoodEntry)) as number;
    return { entryId, mealId };
  });
  return async () => {
    await db.transaction('rw', db.foodEntries, db.meals, db.tombstones, async () => {
      await removeWithTombstone('foodEntries', entryId);
      if (mealId != null) await removeWithTombstone('meals', mealId);
    });
  };
}

export async function updateFoodEntry(id: number, changes: Partial<FoodEntry>): Promise<() => Promise<void>> {
  const before = await db.foodEntries.get(id);
  await db.foodEntries.update(id, changes);
  return async () => {
    if (before) await db.foodEntries.put({ ...before, updatedAt: nowIso() });
  };
}

type IdTable = 'foodEntries' | 'meals' | 'foods';

/** Delete with a tombstone (for future sync). Returns an undo function. */
export async function deleteRecord(table: IdTable, id: number): Promise<() => Promise<void>> {
  const t = db.table(table);
  const before = await db.transaction('rw', t, db.tombstones, () => removeWithTombstone(table, id));
  return async () => {
    if (!before) return;
    await db.transaction('rw', t, db.tombstones, async () => {
      await t.put({ ...before, updatedAt: nowIso() });
      await db.tombstones.delete(before.uuid);
    });
  };
}

async function removeWithTombstone(table: SyncTable, key: number | string) {
  const t = db.table(table);
  const rec = await t.get(key);
  if (!rec) return undefined;
  await t.delete(key);
  await db.tombstones.put({ uuid: rec.uuid, table, deletedAt: nowIso() });
  return rec;
}

/** Upsert fields on a day row. */
export async function updateDay(date: string, changes: Partial<Omit<DayLog, 'date'>>): Promise<void> {
  await db.transaction('rw', db.days, async () => {
    const existing = await db.days.get(date);
    if (existing) await db.days.update(date, changes);
    else await db.days.add({ date, ...changes } as DayLog);
  });
}

export async function saveMeal(meal: New<Meal>): Promise<number> {
  if (meal.id != null) {
    await db.meals.update(meal.id, meal);
    return meal.id;
  }
  return (await db.meals.add({ ...meal, useCount: meal.useCount ?? 0 } as Meal)) as number;
}

export async function saveUserFood(food: New<UserFood>): Promise<number> {
  if (food.id != null) {
    await db.foods.update(food.id, food);
    return food.id;
  }
  return (await db.foods.add(food as UserFood)) as number;
}
