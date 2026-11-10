import Dexie, { type EntityTable, type Table } from 'dexie';
import type { DayLog, FoodEntry, Meal, Settings, SyncFields, Tombstone, Workout } from './types';

export const SCHEMA_VERSION = 1;

export const newUuid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export class FitDB extends Dexie {
  meals!: EntityTable<Meal, 'id'>;
  foodEntries!: EntityTable<FoodEntry, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  days!: EntityTable<DayLog, 'date'>;
  settings!: EntityTable<Settings, 'key'>;
  tombstones!: EntityTable<Tombstone, 'uuid'>;

  constructor(name = 'fittrack') {
    super(name);
    // Schema changes: add db.version(2)... with .upgrade(). Never drop tables.
    // (`archived` is a boolean, which IndexedDB can't index, so it's filtered in memory.)
    this.version(SCHEMA_VERSION).stores({
      meals: '++id, &uuid, name, useCount, lastUsed, updatedAt',
      foodEntries: '++id, &uuid, date, mealId, updatedAt',
      workouts: '++id, &uuid, date, type, updatedAt',
      days: 'date, &uuid, updatedAt',
      settings: 'key, updatedAt',
      tombstones: 'uuid, table, deletedAt',
    });

    for (const t of [this.meals, this.foodEntries, this.workouts, this.days, this.settings]) {
      addSyncHooks(t as unknown as Table<SyncFields>);
    }
  }
}

function addSyncHooks(t: Table<SyncFields>) {
  t.hook('creating', (_pk, obj) => {
    // Preserve values from backups/sync; fill them for fresh records.
    if (!obj.uuid) obj.uuid = newUuid();
    if (!obj.updatedAt) obj.updatedAt = nowIso();
  });
  t.hook('updating', (mods) => {
    if ('updatedAt' in mods) return undefined;
    return { updatedAt: nowIso() };
  });
}

export const db = new FitDB();
