import { fmt } from './ui';

function Stat({ label, value, target, unit = '' }: { label: string; value: number; target?: number; unit?: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  const over = target != null && value > target;
  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-semibold tabular-nums truncate">
        {fmt(value)}{unit}
        {target != null && <span className="font-normal text-zinc-500 text-sm"> / {fmt(target)}</span>}
      </div>
      {target != null && (
        <div className="h-1.5 mt-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${over && label === 'kcal' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function SummaryBar(p: { kcal: number; protein: number; steps: number; kcalTarget?: number; proteinTarget?: number; stepTarget?: number }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-3">
      <Stat label="kcal" value={p.kcal} target={p.kcalTarget} />
      <Stat label="Protein" value={p.protein} target={p.proteinTarget} unit="g" />
      <Stat label="Steps" value={p.steps} target={p.stepTarget} />
    </div>
  );
}
