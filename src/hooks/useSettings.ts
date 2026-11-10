import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { DEFAULT_SETTINGS } from '../db/repo';
import type { Settings } from '../db/types';

export function useSettings(): Settings {
  const s = useLiveQuery(() => db.settings.get('main'), []);
  return { ...(DEFAULT_SETTINGS as Settings), ...s };
}
