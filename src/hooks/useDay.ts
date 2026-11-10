import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { DayLog, FoodEntry } from '../db/types';

export interface DayData {
  entries: FoodEntry[];
  day?: DayLog;
  loaded: boolean;
}

export function useDay(date: string): DayData {
  const data = useLiveQuery(async () => {
    const [entries, day] = await Promise.all([
      db.foodEntries.where('date').equals(date).sortBy('time'),
      db.days.get(date),
    ]);
    return { entries, day };
  }, [date]);
  return { entries: data?.entries ?? [], day: data?.day, loaded: !!data };
}
