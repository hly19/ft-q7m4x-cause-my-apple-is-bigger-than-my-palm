import { useState } from 'react';
import { daysBetween, toLocalDate } from '../utils/dates';
import { updateSettings } from '../db/repo';
import type { Settings } from '../db/types';
import { go } from '../hooks/useRoute';

const BACKUP_DAYS = 7;

export function BackupBanner({ settings, hasData }: { settings: Settings; hasData: boolean }) {
  const now = toLocalDate();
  const ref = [settings.lastBackupAt, settings.backupBannerDismissedAt].filter(Boolean).sort().pop();
  const due = hasData && (!ref || daysBetween(toLocalDate(new Date(ref)), now) > BACKUP_DAYS);
  if (!due) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 pl-3">
      <span className="flex-1 text-sm py-2">
        {settings.lastBackupAt ? 'No backup in over a week.' : 'You haven’t backed up yet.'}
      </span>
      <button className="min-h-11 px-2 font-semibold" onClick={() => go({ page: 'settings' })}>Back up</button>
      <button
        className="min-h-11 min-w-11"
        aria-label="Dismiss"
        onClick={() => updateSettings({ backupBannerDismissedAt: new Date().toISOString() })}
      >
        ✕
      </button>
    </div>
  );
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const KEY = 'fittrack.iosHintDismissed';
function safeGet() { try { return localStorage.getItem(KEY); } catch { return null; } }
function safeSet() { try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ } }

export function IosInstallHint() {
  const [hidden, setHidden] = useState(() => !isIos() || isStandalone() || safeGet() === '1');
  if (hidden) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 pl-3">
      <span className="flex-1 text-sm py-2">
        Install: tap <b>Share</b> → <b>Add to Home Screen</b>. Keeps your data safe from Safari’s 7-day cleanup.
      </span>
      <button className="min-h-11 min-w-11" aria-label="Dismiss" onClick={() => { safeSet(); setHidden(true); }}>✕</button>
    </div>
  );
}
