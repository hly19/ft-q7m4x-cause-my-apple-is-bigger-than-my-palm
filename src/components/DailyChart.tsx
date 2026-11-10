import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayPoint } from '../utils/stats';
import { dayLabel, parseLocalDate } from '../utils/dates';

// One series per chart → single hue, no legend (title names it). #059669 passes light + dark checks.
const MARK = '#059669';

type Key = 'kcal' | 'protein' | 'steps';

export function DailyChart({ title, data, dataKey, target, unit = '' }: { title: string; data: DayPoint[]; dataKey: Key; target?: number; unit?: string }) {
  const values = data.map((d) => d[dataKey]).filter((v): v is number => v != null);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const many = data.length > 10;
  const top = niceCeil(Math.max(0, ...values, target ?? 0) * 1.05);

  return (
    <figure className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-3">
      <figcaption className="flex items-baseline justify-between mb-2">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-zinc-500 tabular-nums">
          {avg != null ? `avg ${avg.toLocaleString()}${unit}` : 'no data'}
          {target != null && ` · target ${target.toLocaleString()}${unit}`}
        </span>
      </figcaption>
      <div className="h-40 text-zinc-500">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap={many ? 2 : '20%'}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'currentColor', fontSize: 11 }}
              interval={many ? 6 : 0}
              tickFormatter={(d: string) => {
                const dt = parseLocalDate(d);
                return many ? `${dt.getDate()}/${dt.getMonth() + 1}` : dt.toLocaleDateString(undefined, { weekday: 'narrow' });
              }}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'currentColor', fontSize: 11 }}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))}
              domain={[0, top]}
              ticks={[0, top / 4, top / 2, (3 * top) / 4, top]}
            />
            <Tooltip
              cursor={{ fill: 'currentColor', fillOpacity: 0.08 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as DayPoint;
                const v = p[dataKey];
                return (
                  <div className="rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow px-3 py-2 text-sm">
                    <div className="text-zinc-500 text-xs">{dayLabel(p.date)}</div>
                    <div className="font-semibold tabular-nums">{v != null ? `${v.toLocaleString()}${unit}` : 'Not logged'}</div>
                  </div>
                );
              }}
            />
            {target != null && (
              <ReferenceLine y={target} stroke="currentColor" strokeOpacity={0.6} strokeDasharray="4 4" ifOverflow="extendDomain" />
            )}
            <Bar dataKey={dataKey} fill={MARK} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** Round up to a value whose quarters are clean (e.g. 2,400 → ticks 600/1,200/1,800). */
function niceCeil(n: number): number {
  if (n <= 0) return 4;
  const mag = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]) if (m * mag >= n) return m * mag;
  return 10 * mag;
}
