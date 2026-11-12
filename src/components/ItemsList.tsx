import type { LoggedItem } from '../db/types';
import { fmtQty } from '../utils/nutrition';

/** Read-only ingredient breakdown for an entry or meal built with the food builder. */
export function ItemsList({ items, factor = 1 }: { items?: LoggedItem[]; factor?: number }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-2 text-sm">
      <div className="text-xs text-zinc-500 mb-1">Ingredients{factor !== 1 ? ` (×${fmtQty(factor)})` : ''}</div>
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex-1">
              {fmtQty(it.qty)} {it.unitLabel} {it.name}
            </span>
            <span className="tabular-nums text-zinc-500">{Math.round(it.kcal * factor)} kcal</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
