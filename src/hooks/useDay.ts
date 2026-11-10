import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { DayLog, FoodEntry, Workout } from '../db/types';

export interface DayData {
  entries: FoodEntry[];
  workouts: Workout[];
  day?: DayLog;
  loaded: boolean;
}

export function useDay(date: string): DayData {
  const data = useLiveQuery(async () => {
    const [entries, workouts, day] = await Promise.all([
      db.foodEntries.where('date').equals(date).sortBy('time'),
      db.workouts.where('date').equals(date).toArray(),
      db.days.get(date),
    ]);
    return { entries, workouts, day };
  }, [date]);
  return { entries: data?.entries ?? [], workouts: data?.workouts ?? [], day: data?.day, loaded: !!data };
}
