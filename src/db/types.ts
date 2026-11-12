// Every record carries `uuid` + `updatedAt` so Phase 4 sync (last-write-wins per
// record) works without a migration. The Dexie hooks in db.ts fill them in.
import type { Category, UnitKey } from '../data/foods';
import type { Profile } from '../utils/goals';
import type { HandSize } from '../utils/nutrition';

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
  items?: LoggedItem[];  // ingredients, if built with the food builder
}

/** One ingredient line, copied at log time (totals for that line). */
export interface LoggedItem {
  foodKey: string;
  name: string;
  qty: number;
  unit: UnitKey;
  unitLabel: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A food the user added to the builder's list. Values are per ONE unit. */
export interface UserFood extends SyncFields {
  id?: number;
  name: string;
  unitLabel: string;     // "bar", "bowl", "slice"
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  category?: Category;
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
  items?: LoggedItem[];
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
  profile?: Partial<Profile>; // goal calculator; stored metric, shown as cm + lb
  units: 'metric' | 'imperial'; // unused: app is fixed to cm, lb, kcal, g
  lastBackupAt?: string;
  backupBannerDismissedAt?: string;
  handSize?: HandSize;   // scales palm/fist/cupped hand/thumb
  aiApiKey?: string;  // phase 3, never exported
}

export type SyncTable = 'meals' | 'foodEntries' | 'workouts' | 'days' | 'settings' | 'foods';

/** Deleted-record marker so sync can propagate deletes. */
export interface Tombstone {
  uuid: string;
  table: SyncTable;
  deletedAt: string;
}

/** Fields the hooks fill in; callers may omit them. */
export type New<T extends SyncFields> = Omit<T, 'uuid' | 'updatedAt'> & Partial<SyncFields>;
