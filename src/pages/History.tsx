import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { go } from '../hooks/useRoute';
import { sumEntries } from '../hooks/useTotals';
import type { FoodEntry } from '../db/types';
import { addDays, dayLabel, today } from '../utils/dates';
import { fmt } from '../components/ui';

const DAYS = 60;

export function History() {
  const rows = useLiveQuery(async () => {
    const from = addDays(today(), -DAYS);
    const [entries, days] = await Promise.all([
      db.foodEntries.where('date').aboveOrEqual(from).toArray(),
      db.days.where('date').aboveOrEqual(from).toArray(),
    ]);
    const map = new Map<string, { entries: FoodEntry[]; steps?: number }>();
    const get = (d: string) => map.get(d) ?? (map.set(d, { entries: [] }), map.get(d)!);
    entries.forEach((e) => get(e.date).entries.push(e));
    days.forEach((d) => d.steps != null && (get(d.date).steps = d.steps));
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, v]) => ({ date, ...sumEntries(v.entries), steps: v.steps }));
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">History</h1>
      {rows?.length === 0 && <p className="text-sm text-zinc-500">No logged days yet.</p>}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {rows?.map((r) => (
          <li key={r.date}>
            <button className="w-full min-h-14 flex items-center gap-3 text-left py-2" onClick={() => go({ page: 'today', date: r.date })}>
              <span className="w-28 font-medium">{dayLabel(r.date)}</span>
              <span className="flex-1 text-sm tabular-nums">
                {fmt(r.kcal)} kcal · {r.protein}g P{r.steps != null && ` · ${fmt(r.steps)} steps`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500">Last {DAYS} days. Charts and weekly averages come in phase 2.</p>
    </div>
  );
}
