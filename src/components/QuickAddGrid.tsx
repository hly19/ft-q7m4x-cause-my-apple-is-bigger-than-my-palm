import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { db } from '../db/db';
import { logMeal } from '../db/repo';
import type { Meal } from '../db/types';
import { PortionPicker, portionLabel } from './PortionPicker';
import { useToast } from './Toast';

const LONG_PRESS_MS = 450;

export function QuickAddGrid({ date }: { date: string }) {
  const meals = useLiveQuery(
    () => db.meals.orderBy('useCount').reverse().filter((m) => !m.archived).limit(8).toArray(),
    [],
  );
  const [picker, setPicker] = useState<Meal | null>(null);
  const toast = useToast();

  const log = async (meal: Meal, portion = 1) => {
    const undo = await logMeal(meal, date, portion);
    toast(`Logged ${meal.name}${portion !== 1 ? ` ×${portionLabel(portion)}` : ''}`, undo);
  };

  if (!meals) return <div className="h-24" />;
  if (meals.length === 0) {
    return (
      <p className="text-sm text-zinc-500 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4">
        Saved meals appear here for one-tap logging. Tick "Save as meal" when adding custom food.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {meals.map((m) => (
          <QuickTile key={m.id} meal={m} onTap={() => log(m)} onMore={() => setPicker(m)} />
        ))}
      </div>
      {picker && (
        <PortionPicker
          name={picker.name}
          kcal={picker.kcal}
          onClose={() => setPicker(null)}
          onPick={(p) => {
            setPicker(null);
            log(picker, p);
          }}
        />
      )}
    </>
  );
}

function QuickTile({ meal, onTap, onMore }: { meal: Meal; onTap: () => void; onMore: () => void }) {
  const timer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

  const start = () => {
    longPressed.current = false;
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      navigator.vibrate?.(10);
      onMore();
    }, LONG_PRESS_MS);
  };
  const cancel = () => clearTimeout(timer.current);

  return (
    <div className="relative flex rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 overflow-hidden">
      <button
        className="flex-1 min-h-16 text-left px-3 py-2 select-none active:bg-emerald-100 dark:active:bg-emerald-900"
        style={{ WebkitTouchCallout: 'none' }}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (longPressed.current) return;
          onTap();
        }}
      >
        <div className="font-medium leading-tight line-clamp-2">{meal.name}</div>
        <div className="text-xs text-zinc-500">
          {meal.kcal} kcal{meal.protein != null ? ` · ${meal.protein}g P` : ''}
        </div>
      </button>
      <button className="w-11 shrink-0 text-zinc-500 hover:bg-emerald-100 dark:hover:bg-emerald-900" onClick={onMore} aria-label={`Portion for ${meal.name}`}>
        …
      </button>
    </div>
  );
}
