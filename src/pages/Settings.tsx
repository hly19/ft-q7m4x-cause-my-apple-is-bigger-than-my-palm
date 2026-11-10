import { useEffect, useRef, useState } from 'react';
import { isStandalone } from '../components/Banners';
import { useToast } from '../components/Toast';
import { Button, inputCls, optNum } from '../components/ui';
import { BackupError, importBackup, parseBackup, runExport, type Backup, type ImportMode } from '../db/backup';
import { updateSettings } from '../db/repo';
import type { Settings as S } from '../db/types';
import { useSettings } from '../hooks/useSettings';

export function Settings() {
  const s = useSettings();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Section title="Targets">
        <NumberSetting label="Calories (kcal)" field="kcalTarget" value={s.kcalTarget} key={`kcalTarget:${s.kcalTarget ?? ''}`} />
        <NumberSetting label="Protein (g)" field="proteinTarget" value={s.proteinTarget} key={`proteinTarget:${s.proteinTarget ?? ''}`} />
        <NumberSetting label="Steps" field="stepTarget" value={s.stepTarget} key={`stepTarget:${s.stepTarget ?? ''}`} />
      </Section>
      <Section title="Units">
        <select className={inputCls} value={s.units} onChange={(e) => updateSettings({ units: e.target.value as S['units'] })} aria-label="Units">
          <option value="metric">Metric (kg)</option>
          <option value="imperial">Imperial (lb)</option>
        </select>
      </Section>
      <BackupSection lastBackupAt={s.lastBackupAt} />
      <StorageSection />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function NumberSetting({ label, field, value }: { label: string; field: 'kcalTarget' | 'proteinTarget' | 'stepTarget'; value?: number }) {
  const [v, setV] = useState(value?.toString() ?? '');
  return (
    <label className="flex items-center gap-3">
      <span className="flex-1">{label}</span>
      <input
        className={`${inputCls} w-32 text-right`}
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={() => {
          const n = optNum(v);
          if (n !== value) updateSettings({ [field]: n });
        }}
      />
    </label>
  );
}

function BackupSection({ lastBackupAt }: { lastBackupAt?: string }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const r = await runExport();
      if (r !== 'cancelled') toast(r === 'shared' ? 'Backup shared' : 'Backup downloaded');
    } catch (e) {
      toast(`Export failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (err) {
      setError(err instanceof BackupError ? err.message : 'Could not read that file.');
    }
  };

  const doImport = async () => {
    if (!pending) return;
    if (mode === 'replace' && !confirm('Replace ALL data on this device with the backup? This cannot be undone.')) return;
    setBusy(true);
    try {
      const r = await importBackup(pending, mode);
      const n = r.added.foodEntries + r.added.meals + r.added.days;
      toast(mode === 'replace' ? 'Backup restored' : `Merged ${n} records (${r.skipped.foodEntries} duplicate entries skipped)`);
      setPending(null);
    } catch (err) {
      setError(`Import failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Backup">
      <p className="text-sm text-zinc-500">
        Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : 'never'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={doExport} disabled={busy}>Export</Button>
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>Import…</Button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {pending && (
        <div className="rounded-xl border border-zinc-300 dark:border-zinc-700 p-3 space-y-2">
          <p className="text-sm">
            Backup from {pending.exportedAt ? new Date(pending.exportedAt).toLocaleString() : 'unknown date'}:{' '}
            {pending.data.foodEntries.length} entries, {pending.data.meals.length} meals, {pending.data.days.length} days.
          </p>
          {(['merge', 'replace'] as const).map((m) => (
            <label key={m} className="flex items-start gap-3 min-h-11">
              <input type="radio" name="mode" className="mt-1 size-5 accent-emerald-600" checked={mode === m} onChange={() => setMode(m)} />
              <span>
                <b>{m === 'merge' ? 'Merge' : 'Replace all'}</b>
                <span className="block text-xs text-zinc-500">
                  {m === 'merge' ? 'Add what’s missing. Keeps existing data; skips duplicates.' : 'Delete everything here and restore the backup exactly.'}
                </span>
              </span>
            </label>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => setPending(null)}>Cancel</Button>
            <Button variant={mode === 'replace' ? 'danger' : 'primary'} className="flex-1" onClick={doImport} disabled={busy}>
              {mode === 'replace' ? 'Replace all' : 'Merge'}
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-zinc-500">On a phone, Export opens the share sheet so you can save to Drive, iCloud or Files.</p>
    </Section>
  );
}

function StorageSection() {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState('');
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
    navigator.storage?.estimate?.().then((e) => e.usage != null && setUsage(`${(e.usage / 1024).toFixed(0)} KB used`)).catch(() => {});
  }, []);

  const request = async () => setPersisted((await navigator.storage?.persist?.()) ?? false);

  return (
    <Section title="Storage">
      <p className="text-sm">
        Persistent storage:{' '}
        <b className={persisted ? 'text-emerald-600' : 'text-amber-600'}>
          {persisted == null ? 'unknown' : persisted ? 'granted' : 'not granted'}
        </b>
        {usage && <span className="text-zinc-500"> · {usage}</span>}
      </p>
      {persisted === false && <Button onClick={request}>Request persistent storage</Button>}
      <p className="text-xs text-zinc-500">
        All data lives only in this browser. Safari may delete data for sites unused for 7 days unless the app is added to the
        Home Screen{isStandalone() ? ' (installed ✓)' : ''}. Export a backup regularly.
      </p>
    </Section>
  );
}
