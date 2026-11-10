import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FitDB, SCHEMA_VERSION } from './db';
import { BackupError, backupFilename, exportBackup, importBackup, parseBackup, type Backup } from './backup';
import type { DayLog, FoodEntry, Meal, Settings, Workout } from './types';

let n = 0;
let db: FitDB;

beforeEach(async () => {
  db = new FitDB(`test-${n++}`);
  await db.open();
});
afterEach(async () => {
  await db.delete();
});

async function seed(target: FitDB) {
  await target.settings.add({ key: 'main', units: 'metric', kcalTarget: 2200, stepTarget: 10000, aiApiKey: 'sk-secret' } as Settings);
  const oats = await target.meals.add({ name: 'Oats', kcal: 350, protein: 12, tags: ['breakfast'], useCount: 5, lastUsed: '2026-11-09' } as Meal);
  await target.meals.add({ name: 'Stir fry', kcal: 650, protein: 40, useCount: 2, archived: true } as Meal);
  await target.foodEntries.bulkAdd([
    { date: '2026-11-09', time: '08:00', mealId: oats, name: 'Oats', kcal: 350, protein: 12, portion: 1 },
    { date: '2026-11-09', time: '13:10', name: 'Sandwich', kcal: 500, portion: 1.5, note: 'café' },
  ] as FoodEntry[]);
  await target.workouts.add({ date: '2026-11-09', type: 'Run', durationMin: 30, intensity: 'medium' } as Workout);
  await target.days.add({ date: '2026-11-09', steps: 8123, bodyWeight: 71.5 } as DayLog);
  await target.tombstones.add({ uuid: 'gone-1', table: 'foodEntries', deletedAt: '2026-11-08T10:00:00.000Z' });
}

async function dump(target: FitDB) {
  return {
    meals: await target.meals.toArray(),
    foodEntries: await target.foodEntries.toArray(),
    workouts: await target.workouts.toArray(),
    days: await target.days.toArray(),
    settings: (await target.settings.toArray()).map(({ aiApiKey: _k, ...s }) => s),
    tombstones: await target.tombstones.toArray(),
  };
}

const roundTrip = (b: Backup) => parseBackup(JSON.stringify(b));

describe('sync fields', () => {
  it('fills uuid and updatedAt on create and bumps updatedAt on update', async () => {
    const id = await db.meals.add({ name: 'X', kcal: 1, useCount: 0 } as Meal);
    const m = (await db.meals.get(id))!;
    expect(m.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(m.updatedAt).toBeTruthy();
    await new Promise((r) => setTimeout(r, 5));
    await db.meals.update(id, { kcal: 2 });
    const m2 = (await db.meals.get(id))!;
    expect(m2.uuid).toBe(m.uuid);
    expect(m2.updatedAt > m.updatedAt).toBe(true);
  });
});

describe('backup export', () => {
  it('includes every table, schemaVersion and exportedAt, but not the API key', async () => {
    await seed(db);
    const b = await exportBackup(db);
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Date.parse(b.exportedAt)).not.toBeNaN();
    expect(Object.keys(b.data).sort()).toEqual(['days', 'foodEntries', 'meals', 'settings', 'tombstones', 'workouts']);
    expect(JSON.stringify(b)).not.toContain('sk-secret');
  });

  it('names the file with the local date', () => {
    expect(backupFilename(new Date(2026, 10, 10, 23, 50))).toBe('fittrack-backup-2026-11-10.json');
  });
});

describe('backup round-trip', () => {
  it('export → wipe → replace import restores everything exactly', async () => {
    await seed(db);
    const before = await dump(db);
    const backup = roundTrip(await exportBackup(db));

    await db.delete();
    db = new FitDB(`test-${n++}`);
    await db.open();
    await importBackup(backup, 'replace', db);

    expect(await dump(db)).toEqual(before);
  });

  it('replace wipes data that is not in the backup but keeps the local API key', async () => {
    await seed(db);
    const backup = roundTrip(await exportBackup(db));
    await db.foodEntries.add({ date: '2026-11-10', time: '09:00', name: 'Extra', kcal: 100, portion: 1 } as FoodEntry);
    await importBackup(backup, 'replace', db);
    expect(await db.foodEntries.count()).toBe(2);
    expect((await db.settings.get('main'))!.aiApiKey).toBe('sk-secret');
  });

  it('merge into the same data is a no-op', async () => {
    await seed(db);
    const before = await dump(db);
    const r = await importBackup(roundTrip(await exportBackup(db)), 'merge', db);
    expect(r.added.foodEntries).toBe(0);
    expect(r.added.workouts).toBe(0);
    expect(r.added.meals).toBe(0);
    expect(await dump(db)).toEqual(before);
  });

  it('merge adds new entries, skips date+time+name duplicates, remaps meal ids', async () => {
    const other = new FitDB(`test-${n++}`);
    await seed(other);
    const backup = roundTrip(await exportBackup(other));
    await other.delete();

    // Local device: a different meal (takes id 1), a duplicate entry by date+time+name, partial day.
    await db.settings.add({ key: 'main', units: 'imperial' } as Settings);
    const localMeal = await db.meals.add({ name: 'Eggs', kcal: 200, useCount: 1 } as Meal);
    await db.foodEntries.add({ date: '2026-11-09', time: '13:10', name: 'sandwich', kcal: 480, portion: 1 } as FoodEntry);
    await db.days.add({ date: '2026-11-09', note: 'tired' } as DayLog);

    const r = await importBackup(backup, 'merge', db);

    expect(r.added.foodEntries).toBe(1);
    expect(r.skipped.foodEntries).toBe(1);
    const oats = (await db.meals.where('name').equals('Oats').first())!;
    expect(oats.id).not.toBe(localMeal);
    const oatsEntry = (await db.foodEntries.filter((e) => e.name === 'Oats').first())!;
    expect(oatsEntry.mealId).toBe(oats.id);

    const day = (await db.days.get('2026-11-09'))!;
    expect(day).toMatchObject({ steps: 8123, bodyWeight: 71.5, note: 'tired' });

    const s = (await db.settings.get('main'))!;
    expect(s.units).toBe('imperial');
    expect(s.kcalTarget).toBe(2200);
    expect(await db.workouts.count()).toBe(1);
  });
});

describe('backup validation', () => {
  it('rejects non-JSON, missing schemaVersion, and newer schemas', () => {
    expect(() => parseBackup('nope')).toThrow(BackupError);
    expect(() => parseBackup('{"data":{}}')).toThrow(/schemaVersion/);
    expect(() => parseBackup(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, data: {} }))).toThrow(/newer/);
    expect(() => parseBackup(JSON.stringify({ schemaVersion: 1, data: { meals: 'x' } }))).toThrow(/not a list/);
    expect(() =>
      parseBackup(JSON.stringify({ schemaVersion: 1, data: { foodEntries: [{ date: '2026-01-01' }] } })),
    ).toThrow(/food entry/);
  });

  it('accepts a backup with missing tables', () => {
    const b = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: 'x', data: { days: [] } }));
    expect(b.data.meals).toEqual([]);
  });
});

describe('merge keeps legit same-minute repeats', () => {
  it('imports two identical entries into an empty db', async () => {
    const other = new FitDB(`test-${n++}`);
    await other.foodEntries.bulkAdd([
      { date: '2026-11-09', time: '10:00', name: 'Coffee', kcal: 50, portion: 1 },
      { date: '2026-11-09', time: '10:00', name: 'Coffee', kcal: 50, portion: 1 },
    ] as FoodEntry[]);
    const backup = roundTrip(await exportBackup(other));
    await other.delete();
    await importBackup(backup, 'merge', db);
    expect(await db.foodEntries.count()).toBe(2);
  });
});
