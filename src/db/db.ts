import Dexie, { type EntityTable, type Table } from 'dexie';
import type { DayLog, FoodEntry, Meal, Settings, SyncFields, Tombstone, UserFood, Workout } from './types';

export const SCHEMA_VERSION = 2;

export const newUuid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export class FitDB extends Dexie {
  meals!: EntityTable<Meal, 'id'>;
  foodEntries!: EntityTable<FoodEntry, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  days!: EntityTable<DayLog, 'date'>;
  settings!: EntityTable<Settings, 'key'>;
  tombstones!: EntityTable<Tombstone, 'uuid'>;
  foods!: EntityTable<UserFood, 'id'>;

  constructor(name = 'fittrack') {
    super(name);
    // Schema changes: add db.version(2)... with .upgrade(). Never drop tables.
    // (`archived` is a boolean, which IndexedDB can't index, so it's filtered in memory.)
    this.version(1).stores({
      meals: '++id, &uuid, name, useCount, lastUsed, updatedAt',
      foodEntries: '++id, &uuid, date, mealId, updatedAt',
      workouts: '++id, &uuid, date, type, updatedAt',
      days: 'date, &uuid, updatedAt',
      settings: 'key, updatedAt',
      tombstones: 'uuid, table, deletedAt',
    });
    // v2: user-added foods for the food builder. (items/handSize are unindexed fields.)
    this.version(2).stores({
      foods: '++id, &uuid, name, updatedAt',
    });

    for (const t of [this.meals, this.foodEntries, this.workouts, this.days, this.settings, this.foods]) {
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
