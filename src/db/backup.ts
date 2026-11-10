import { db as defaultDb, nowIso, SCHEMA_VERSION, type FitDB } from './db';
import type { DayLog, FoodEntry, Meal, Settings, Tombstone, Workout } from './types';
import { toLocalDate } from '../utils/dates';

export interface BackupData {
  meals: Meal[];
  foodEntries: FoodEntry[];
  workouts: Workout[];
  days: DayLog[];
  settings: Settings[];
  tombstones: Tombstone[];
}

export interface Backup {
  app: 'fittrack';
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

const TABLES = ['meals', 'foodEntries', 'workouts', 'days', 'settings', 'tombstones'] as const;

export class BackupError extends Error {}

/** Snapshot every table. The AI API key is stripped so backups are safe to store in the cloud. */
export async function exportBackup(db: FitDB = defaultDb): Promise<Backup> {
  return db.transaction('r', db.tables, async () => {
    const [meals, foodEntries, workouts, days, settings, tombstones] = await Promise.all([
      db.meals.toArray(),
      db.foodEntries.toArray(),
      db.workouts.toArray(),
      db.days.toArray(),
      db.settings.toArray(),
      db.tombstones.toArray(),
    ]);
    return {
      app: 'fittrack',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: nowIso(),
      data: {
        meals,
        foodEntries,
        workouts,
        days,
        settings: settings.map(({ aiApiKey: _omit, ...s }) => s),
        tombstones,
      },
    };
  });
}

export const backupFilename = (d = new Date()) => `fittrack-backup-${toLocalDate(d)}.json`;

/** Parse + validate a backup file's text. Throws BackupError with a user-readable message. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('Not a valid JSON file.');
  }
  return validateBackup(raw);
}

export function validateBackup(raw: unknown): Backup {
  if (!raw || typeof raw !== 'object') throw new BackupError('Not a FitTrack backup.');
  const b = raw as Partial<Backup>;
  if (typeof b.schemaVersion !== 'number') throw new BackupError('Missing schemaVersion — not a FitTrack backup.');
  if (b.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(`Backup is from a newer app version (schema ${b.schemaVersion}). Update the app first.`);
  }
  if (b.schemaVersion < 1) throw new BackupError(`Unsupported schemaVersion ${b.schemaVersion}.`);
  if (!b.data || typeof b.data !== 'object') throw new BackupError('Backup has no data.');
  const data = {} as BackupData;
  for (const t of TABLES) {
    const rows = (b.data as unknown as Record<string, unknown>)[t];
    if (rows === undefined) {
      (data as unknown as Record<string, unknown[]>)[t] = [];
      continue;
    }
    if (!Array.isArray(rows)) throw new BackupError(`"${t}" is not a list.`);
    (data as unknown as Record<string, unknown[]>)[t] = rows;
  }
  for (const e of data.foodEntries) {
    if (typeof e.date !== 'string' || typeof e.name !== 'string' || typeof e.kcal !== 'number') {
      throw new BackupError('A food entry is missing date, name or kcal.');
    }
  }
  for (const d of data.days) {
    if (typeof d.date !== 'string') throw new BackupError('A day row is missing its date.');
  }
  return { app: 'fittrack', schemaVersion: b.schemaVersion, exportedAt: String(b.exportedAt ?? ''), data };
}

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
  added: Record<keyof BackupData, number>;
  skipped: Record<keyof BackupData, number>;
}

const zero = (): Record<keyof BackupData, number> =>
  ({ meals: 0, foodEntries: 0, workouts: 0, days: 0, settings: 0, tombstones: 0 });

export async function importBackup(backup: Backup, mode: ImportMode, db: FitDB = defaultDb): Promise<ImportResult> {
  return mode === 'replace' ? replaceAll(backup, db) : merge(backup, db);
}

/** Wipe everything and restore the backup exactly (ids, uuids, timestamps preserved). */
async function replaceAll(backup: Backup, db: FitDB): Promise<ImportResult> {
  const result: ImportResult = { added: zero(), skipped: zero() };
  await db.transaction('rw', db.tables, async () => {
    // Keep the local-only API key across a restore.
    const apiKey = (await db.settings.get('main'))?.aiApiKey;
    await Promise.all(db.tables.map((t) => t.clear()));
    for (const t of TABLES) {
      const rows = backup.data[t];
      await db.table(t).bulkAdd(rows);
      result.added[t] = rows.length;
    }
    if (apiKey) await db.settings.update('main', { aiApiKey: apiKey });
  });
  return result;
}

const norm = (s: string) => s.trim().toLowerCase();
const newer = (a?: string, b?: string) => (a ?? '') > (b ?? '');

/**
 * Merge a backup into existing data.
 * - meals: same uuid → newer wins; same name → treated as the same meal; else added.
 * - days: merged by date, field by field (newer record wins per field it sets).
 * - food entries: skipped if uuid or date+time+name already exists.
 * - workouts: skipped if uuid or date+type+duration already exists.
 * - settings: local settings kept; empty local targets filled from the backup.
 */
async function merge(backup: Backup, db: FitDB): Promise<ImportResult> {
  const r: ImportResult = { added: zero(), skipped: zero() };
  const { data } = backup;

  await db.transaction('rw', db.tables, async () => {
    // Meals first so food entries can be re-pointed at local meal ids.
    const mealIdMap = new Map<number, number>();
    const localMeals = await db.meals.toArray();
    const byUuid = new Map(localMeals.map((m) => [m.uuid, m]));
    const byName = new Map(localMeals.map((m) => [norm(m.name), m]));
    for (const m of data.meals) {
      const { id: oldId, ...rest } = m;
      const match = (m.uuid && byUuid.get(m.uuid)) || byName.get(norm(m.name));
      if (match) {
        if (match.uuid === m.uuid && newer(m.updatedAt, match.updatedAt)) {
          await db.meals.put({ ...rest, id: match.id });
          r.added.meals++;
        } else r.skipped.meals++;
        if (oldId != null) mealIdMap.set(oldId, match.id!);
      } else {
        const newId = (await db.meals.add(rest as Meal)) as number;
        if (oldId != null) mealIdMap.set(oldId, newId);
        byName.set(norm(m.name), { ...m, id: newId });
        r.added.meals++;
      }
    }

    const entries = await db.foodEntries.toArray();
    const entryUuids = new Set(entries.map((e) => e.uuid));
    const entryKeys = new Set(entries.map((e) => `${e.date}|${e.time}|${norm(e.name)}`));
    for (const e of data.foodEntries) {
      const key = `${e.date}|${e.time}|${norm(e.name)}`;
      if ((e.uuid && entryUuids.has(e.uuid)) || entryKeys.has(key)) {
        r.skipped.foodEntries++;
        continue;
      }
      const { id: _id, ...rest } = e;
      const mealId = e.mealId != null ? mealIdMap.get(e.mealId) : undefined;
      await db.foodEntries.add({ ...rest, mealId } as FoodEntry);
      r.added.foodEntries++;
    }

    const workouts = await db.workouts.toArray();
    const wUuids = new Set(workouts.map((w) => w.uuid));
    const wKeys = new Set(workouts.map((w) => `${w.date}|${norm(w.type)}|${w.durationMin ?? ''}`));
    for (const w of data.workouts) {
      const key = `${w.date}|${norm(w.type)}|${w.durationMin ?? ''}`;
      if ((w.uuid && wUuids.has(w.uuid)) || wKeys.has(key)) {
        r.skipped.workouts++;
        continue;
      }
      const { id: _id, ...rest } = w;
      await db.workouts.add(rest as Workout);
      r.added.workouts++;
    }

    for (const d of data.days) {
      const local = await db.days.get(d.date);
      if (!local) {
        await db.days.add(d);
        r.added.days++;
        continue;
      }
      const [winner, loser] = newer(d.updatedAt, local.updatedAt) ? [d, local] : [local, d];
      const merged: DayLog = { ...stripUndefined(loser), ...stripUndefined(winner), uuid: local.uuid };
      if (JSON.stringify(merged) !== JSON.stringify(local)) {
        await db.days.put({ ...merged, updatedAt: nowIso() });
        r.added.days++;
      } else r.skipped.days++;
    }

    const incoming = data.settings.find((s) => s.key === 'main');
    const local = await db.settings.get('main');
    if (incoming && !local) {
      await db.settings.add(incoming);
      r.added.settings++;
    } else if (incoming && local) {
      const fill: Partial<Settings> = {};
      for (const k of ['kcalTarget', 'proteinTarget', 'stepTarget'] as const) {
        if (local[k] == null && incoming[k] != null) fill[k] = incoming[k];
      }
      if (Object.keys(fill).length) {
        await db.settings.update('main', fill);
        r.added.settings++;
      } else r.skipped.settings++;
    }

    for (const t of data.tombstones) {
      if (await db.tombstones.get(t.uuid)) r.skipped.tombstones++;
      else {
        await db.tombstones.add(t);
        r.added.tombstones++;
      }
    }
  });
  return r;
}

function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

/** Download the backup, or hand it to the share sheet on mobile (Drive, iCloud, …). */
export async function saveBackupFile(backup: Backup): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const name = backupFilename();
  const json = JSON.stringify(backup, null, 2);
  const file = new File([json], name, { type: 'application/json' });
  const isMobile = matchMedia('(pointer: coarse)').matches;
  if (isMobile && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      // Fall through to download on other share failures.
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

/** Export + save + record lastBackupAt (only after a successful save). */
export async function runExport(db: FitDB = defaultDb): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const backup = await exportBackup(db);
  const outcome = await saveBackupFile(backup);
  if (outcome !== 'cancelled') {
    await db.settings.update('main', { lastBackupAt: nowIso() });
  }
  return outcome;
}
