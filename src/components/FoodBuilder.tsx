import { useMemo, useRef, useState } from 'react';
import { db } from '../db/db';
import { logCustom, saveMeal } from '../db/repo';
import type { LoggedItem } from '../db/types';
import { TAKEOUT_KEYS, type FoodDef } from '../data/foods';
import { userFoodToDef, useFoods } from '../hooks/useFoods';
import { useSettings } from '../hooks/useSettings';
import { fmtQty, isAmountUnit, isHandUnit, itemNutrition, searchFoods, sumMacros, unitLabel } from '../utils/nutrition';
import { useToast } from './Toast';
import { Button, Input, inputCls } from './ui';
import { UserFoodForm } from './UserFoodForm';

interface Item { id: number; food: FoodDef; unitIdx: number; qty: number }

let nextId = 1;
const defaultQty = (food: FoodDef, idx: number) => (isAmountUnit(food.units[idx]) ? 100 : 1);
const shortName = (n: string) => n.replace(/\s*\(.*?\)/g, '').replace(/,.*$/, '').trim();

export function FoodBuilder({ date, onDone, mode = 'log' }: { date?: string; onDone: () => void; mode?: 'log' | 'saveMeal' }) {
  const lib = useFoods();
  const { handSize = 'medium' } = useSettings();
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [save, setSave] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const results = q.trim() ? searchFoods(q, lib.all, 12) : lib.suggestions;
  const lines = useMemo(
    () => items.map((it) => ({ it, m: itemNutrition(it.food, it.food.units[it.unitIdx], it.qty, handSize) })),
    [items, handSize],
  );
  const total = sumMacros(lines.map((l) => l.m));
  const autoName = items.map((i) => shortName(i.food.name)).filter((v, i, a) => a.indexOf(v) === i).join(' + ');
  const finalName = (nameEdited ? name : autoName).trim();
  const usesHands = items.some((i) => isHandUnit(i.food.units[i.unitIdx]));
  const hasDish = items.some((i) => i.food.category === 'dish');
  const takeout = TAKEOUT_KEYS.map((k) => lib.byKey.get(k)).filter((x): x is FoodDef => !!x);

  const add = (food: FoodDef) => {
    setItems((xs) => [...xs, { id: nextId++, food, unitIdx: 0, qty: defaultQty(food, 0) }]);
    setQ('');
    searchRef.current?.focus();
  };
  const update = (id: number, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));

  const log = async () => {
    if (!items.length || !finalName) return;
    const logged: LoggedItem[] = lines.map(({ it, m }) => {
      const u = it.food.units[it.unitIdx];
      return {
        foodKey: it.food.key,
        name: it.food.name,
        qty: it.qty,
        unit: u.unit,
        unitLabel: unitLabel(u),
        kcal: Math.round(m.kcal),
        protein: Math.round(m.protein * 10) / 10,
        carbs: Math.round(m.carbs * 10) / 10,
        fat: Math.round(m.fat * 10) / 10,
      };
    });
    if (mode === 'saveMeal') {
      await saveMeal({ name: finalName, kcal: total.kcal, protein: total.protein, carbs: total.carbs, fat: total.fat, items: logged, useCount: 0 });
      toast(`Saved meal ${finalName}`);
      onDone();
      return;
    }
    const undo = await logCustom(
      { name: finalName, kcal: total.kcal, protein: total.protein, carbs: total.carbs, fat: total.fat, items: logged, saveAsMeal: save },
      date!,
    );
    toast(`Logged ${finalName} · ${total.kcal} kcal`, undo);
    onDone();
  };

  return (
    <div className="space-y-3">
      <Input
        ref={searchRef}
        autoFocus
        type="search"
        placeholder="Search food: bread, cheese, chicken…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search food"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) {
            e.preventDefault();
            add(results[0]);
          }
        }}
      />

      <div>
        {!q.trim() && <p className="text-xs text-zinc-500 mb-1">{items.length ? 'Add more:' : 'Common foods:'}</p>}
        {q.trim() && results.length === 0 ? (
          <button type="button" className="w-full min-h-11 text-left text-emerald-600 font-medium" onClick={() => setAdding(q.trim())}>
            Not on the list? Add “{q.trim()}” to my foods
          </button>
        ) : (
          <div className={q.trim() ? 'divide-y divide-zinc-200 dark:divide-zinc-800 max-h-56 overflow-y-auto' : 'flex flex-wrap gap-2'}>
            {results.map((f) =>
              q.trim() ? (
                <button key={f.key} type="button" className="w-full min-h-11 flex items-center gap-2 text-left py-1" onClick={() => add(f)}>
                  <span className="flex-1">{f.name}</span>
                  <span className="text-xs text-zinc-500">{unitLabel(f.units[0])}</span>
                </button>
              ) : (
                <button key={f.key} type="button" className="min-h-11 px-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm" onClick={() => add(f)}>
                  {shortName(f.name)}
                </button>
              ),
            )}
          </div>
        )}
        {!q.trim() && takeout.length > 0 && (
          <>
            <p className="text-xs text-zinc-500 mt-2 mb-1">Popular takeout:</p>
            <div className="flex flex-wrap gap-2">
              {takeout.map((f) => (
                <button key={f.key} type="button" className="min-h-11 px-3 rounded-full bg-amber-50 dark:bg-amber-950/60 text-sm" onClick={() => add(f)}>
                  {shortName(f.name)}
                </button>
              ))}
            </div>
          </>
        )}
        {q.trim() && results.length > 0 && (
          <button type="button" className="min-h-11 text-sm text-zinc-500" onClick={() => setAdding(q.trim())}>
            Can’t find it? Add your own
          </button>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-2" aria-label="Ingredients">
          {lines.map(({ it, m }) => {
            const u = it.food.units[it.unitIdx];
            const amount = isAmountUnit(u);
            const step = it.qty < 1 ? 0.25 : 0.5;
            return (
              <li key={it.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-medium">{it.food.name}</span>
                  <span className="tabular-nums text-sm">{Math.round(m.kcal)} kcal</span>
                  <button type="button" className="min-h-11 min-w-11 text-zinc-400 hover:text-red-600" aria-label={`Remove ${it.food.name}`} onClick={() => remove(it.id)}>✕</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {amount ? (
                    <input
                      className={`${inputCls.replace('w-full', 'w-24')} text-right`}
                      inputMode="numeric"
                      value={it.qty}
                      aria-label={`${it.food.name} amount`}
                      onChange={(e) => update(it.id, { qty: Math.max(0, Number(e.target.value.replace(/[^\d.]/g, '')) || 0) })}
                    />
                  ) : (
                    <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <button type="button" className="min-h-11 min-w-11 text-xl" aria-label="Less" onClick={() => update(it.id, { qty: Math.max(0.25, it.qty - step) })}>−</button>
                      <span className="w-10 text-center tabular-nums font-semibold" aria-label={`${it.food.name} quantity`}>{fmtQty(it.qty)}</span>
                      <button type="button" className="min-h-11 min-w-11 text-xl" aria-label="More" onClick={() => update(it.id, { qty: it.qty + (it.qty < 1 ? 0.25 : 0.5) })}>+</button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`${it.food.name} unit`}>
                    {it.food.units.map((un, idx) => (
                      <button
                        key={idx}
                        type="button"
                        role="radio"
                        aria-checked={idx === it.unitIdx}
                        onClick={() => update(it.id, { unitIdx: idx, qty: isAmountUnit(un) !== amount ? defaultQty(it.food, idx) : it.qty })}
                        className={`min-h-11 px-3 rounded-lg whitespace-nowrap text-sm ${idx === it.unitIdx ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                      >
                        {unitLabel(un)}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-center" aria-live="polite">
            {[
              ['kcal', total.kcal.toLocaleString()],
              ['Protein', `${total.protein}g`],
              ['Carbs', `${total.carbs}g`],
              ['Fat', `${total.fat}g`],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-xs text-zinc-500">{l}</div>
                <div className="font-semibold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          {hasDish && <p className="text-xs text-zinc-500 -mt-1">Restaurant portions vary. When unsure, pick the bigger size.</p>}
          {usesHands && <p className="text-xs text-zinc-500 -mt-1">Hand portions sized for a {handSize} hand (change in Settings).</p>}
          <Input
            value={nameEdited ? name : autoName}
            onChange={(e) => {
              setName(e.target.value);
              setNameEdited(true);
            }}
            placeholder="Name, e.g. Grilled cheese"
            aria-label="Meal name"
          />
          {mode === 'log' && (
            <label className="flex items-center gap-3 min-h-11">
              <input type="checkbox" className="size-5 accent-emerald-600" checked={save} onChange={(e) => setSave(e.target.checked)} />
              Save as meal (one tap next time)
            </label>
          )}
          <Button variant="primary" className="w-full" disabled={!finalName} onClick={log}>
            {mode === 'log' ? 'Log it' : 'Save meal'} · {total.kcal} kcal
          </Button>
        </>
      )}

      {adding != null && (
        <UserFoodForm
          initialName={adding}
          onClose={() => setAdding(null)}
          onSaved={async (id) => {
            const uf = await db.foods.get(id);
            if (uf) add(userFoodToDef(uf));
          }}
        />
      )}
    </div>
  );
}
