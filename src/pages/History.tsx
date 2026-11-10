import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { DailyChart } from '../components/DailyChart';
import { fmt } from '../components/ui';
import { db } from '../db/db';
import { go } from '../hooks/useRoute';
import { useSettings } from '../hooks/useSettings';
import { addDays, dayLabel, parseLocalDate, today } from '../utils/dates';
import { dailySeries, weekStart, weeklyAverages } from '../utils/stats';

const LIST_DAYS = 60;
const WEEKS = 8;

export default function History() {
  const settings = useSettings();
  const [range, setRange] = useState<7 | 30>(7);
  const end = today();
  const from = addDays(weekStart(end), -7 * (WEEKS - 1)); // covers charts (≤30d), 8 weeks, and the list
  const listFrom = addDays(end, -LIST_DAYS);
  const start = from < listFrom ? from : listFrom;

  const raw = useLiveQuery(async () => {
    const [entries, days] = await Promise.all([
      db.foodEntries.where('date').between(start, end, true, true).toArray(),
      db.days.where('date').between(start, end, true, true).toArray(),
    ]);
    return { entries, days };
  }, [start, end]);

  const all = useMemo(() => (raw ? dailySeries(raw.entries, raw.days, start, end) : []), [raw, start, end]);
  const chartData = all.slice(-range);
  const weeks = useMemo(() => weeklyAverages(all.filter((p) => p.date >= from)).filter((w) => w.kcal != null || w.steps != null), [all, from]);
  const logged = all.filter((p) => p.kcal != null || p.steps != null).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1" role="radiogroup" aria-label="Range">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={range === r}
              onClick={() => setRange(r)}
              className={`min-h-9 px-3 rounded-md text-sm ${range === r ? 'bg-white dark:bg-zinc-950 shadow font-semibold' : 'text-zinc-500'}`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <DailyChart title="Calories" data={chartData} dataKey="kcal" target={settings.kcalTarget} />
      <DailyChart title="Protein" data={chartData} dataKey="protein" target={settings.proteinTarget} unit="g" />
      <DailyChart title="Steps" data={chartData} dataKey="steps" target={settings.stepTarget} />

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1">Weekly averages</h2>
        {raw && weeks.length === 0 && <p className="text-sm text-zinc-500 py-2">No data yet.</p>}
        <table className="w-full text-sm tabular-nums">
          <thead className="text-xs text-zinc-500 text-right">
            <tr>
              <th className="text-left font-normal py-1">Week of</th>
              <th className="font-normal">kcal</th>
              <th className="font-normal">Protein</th>
              <th className="font-normal">Steps</th>
              <th className="font-normal">Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-right">
            {weeks.map((w) => (
              <tr key={w.weekStart}>
                <td className="text-left py-2">{parseLocalDate(w.weekStart).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                <td>{w.kcal != null ? fmt(w.kcal) : '–'}</td>
                <td>{w.protein != null ? `${w.protein}g` : '–'}</td>
                <td>{w.steps != null ? fmt(w.steps) : '–'}</td>
                <td className="text-zinc-500">{w.daysLogged}/7</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-zinc-500 mt-1">Averages count only days you logged.</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Days</h2>
        {raw && logged.length === 0 && <p className="text-sm text-zinc-500 py-2">No logged days yet.</p>}
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {logged.filter((p) => p.date >= listFrom).map((r) => (
            <li key={r.date}>
              <button className="w-full min-h-12 flex items-center gap-3 text-left py-2" onClick={() => go({ page: 'today', date: r.date })}>
                <span className="w-28 font-medium">{dayLabel(r.date)}</span>
                <span className="flex-1 text-sm tabular-nums text-right">
                  {r.kcal != null ? `${fmt(r.kcal)} kcal · ${r.protein}g P` : '—'}
                  {r.steps != null && ` · ${fmt(r.steps)} steps`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
