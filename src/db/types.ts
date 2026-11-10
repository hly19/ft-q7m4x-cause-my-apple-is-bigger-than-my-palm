// Every record carries `uuid` + `updatedAt` so Phase 4 sync (last-write-wins per
// record) works without a migration. The Dexie hooks in db.ts fill them in.
import type { Profile } from '../utils/goals';

export interface SyncFields {
  uuid: string;       // stable id across devices (crypto.randomUUID)
  updatedAt: string;  // ISO timestamp, bumped on every write
}

export interface Meal extends SyncFields {
  id?: number;
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  tags?: string[];
  useCount: number;
  lastUsed?: string;  // ISO date
  archived?: boolean;
}

/** kcal/macros are for ONE portion; totals = value × portion. */
export interface FoodEntry extends SyncFields {
  id?: number;
  date: string;       // YYYY-MM-DD local
  time: string;       // HH:mm
  mealId?: number;
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion: number;
  note?: string;
}

export type Intensity = 'easy' | 'medium' | 'hard';

export interface Workout extends SyncFields {
  id?: number;
  date: string;
  type: string;
  durationMin?: number;
  intensity?: Intensity;
  note?: string;
}

export interface DayLog extends SyncFields {
  date: string;       // primary key
  steps?: number;
  bodyWeight?: number;
  note?: string;
}

export interface Settings extends SyncFields {
  key: 'main';
  kcalTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;   // g
  fatTarget?: number;     // g
  stepTarget?: number;
  profile?: Partial<Profile>; // for the goal calculator; stored metric
  units: 'metric' | 'imperial';
  lastBackupAt?: string;
  backupBannerDismissedAt?: string;
  aiApiKey?: string;  // phase 3, never exported
}

export type SyncTable = 'meals' | 'foodEntries' | 'workouts' | 'days' | 'settings';

/** Deleted-record marker so sync can propagate deletes. */
export interface Tombstone {
  uuid: string;
  table: SyncTable;
  deletedAt: string;
}

/** Fields the hooks fill in; callers may omit them. */
export type New<T extends SyncFields> = Omit<T, 'uuid' | 'updatedAt'> & Partial<SyncFields>;
