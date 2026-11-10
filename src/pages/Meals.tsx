import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Button, Input, inputCls, optNum } from '../components/ui';
import { db } from '../db/db';
import { saveMeal } from '../db/repo';
import type { Meal } from '../db/types';

type Sort = 'used' | 'az' | 'recent';

export function Meals() {
  const meals = useLiveQuery(() => db.meals.toArray(), []);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('used');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Partial<Meal> | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = (meals ?? []).filter(
      (m) => !!m.archived === showArchived && (!needle || m.name.toLowerCase().includes(needle) || m.tags?.some((t) => t.toLowerCase().includes(needle))),
    );
    const cmp: Record<Sort, (a: Meal, b: Meal) => number> = {
      used: (a, b) => b.useCount - a.useCount || a.name.localeCompare(b.name),
      az: (a, b) => a.name.localeCompare(b.name),
      recent: (a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? '') || a.name.localeCompare(b.name),
    };
    return filtered.sort(cmp[sort]);
  }, [meals, q, sort, showArchived]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meals</h1>
        <Button variant="primary" onClick={() => setEditing({})}>+ Meal</Button>
      </div>
      <Input type="search" placeholder="Search meals or tags" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <div className="flex gap-2">
        <select className={`${inputCls} flex-1`} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="used">Most used</option>
          <option value="az">A–Z</option>
          <option value="recent">Recent</option>
        </select>
        <Button onClick={() => setShowArchived(!showArchived)}>{showArchived ? 'Active' : 'Archived'}</Button>
      </div>
      {list.length === 0 && <p className="text-sm text-zinc-500 py-4">{showArchived ? 'No archived meals.' : 'No meals yet.'}</p>}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {list.map((m) => (
          <li key={m.id}>
            <button className="w-full min-h-14 flex items-center gap-3 text-left py-2" onClick={() => setEditing(m)}>
              <span className="flex-1">
                <span className="block">{m.name}</span>
                <span className="text-xs text-zinc-500">
                  {m.kcal} kcal{m.protein != null && ` · ${m.protein}g P`}
                  {m.tags?.length ? ` · ${m.tags.join(', ')}` : ''}
                </span>
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">×{m.useCount}</span>
            </button>
          </li>
        ))}
      </ul>
      {editing && <MealForm meal={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MealForm({ meal, onClose }: { meal: Partial<Meal>; onClose: () => void }) {
  const [f, setF] = useState({
    name: meal.name ?? '',
    kcal: meal.kcal?.toString() ?? '',
    protein: meal.protein?.toString() ?? '',
    carbs: meal.carbs?.toString() ?? '',
    fat: meal.fat?.toString() ?? '',
    tags: meal.tags?.join(', ') ?? '',
  });
  const toast = useToast();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const kcal = optNum(f.kcal);
  const valid = f.name.trim() !== '' && kcal != null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const tags = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
    await saveMeal({
      ...(meal as Meal),
      name: f.name.trim(),
      kcal: Math.round(kcal),
      protein: optNum(f.protein),
      carbs: optNum(f.carbs),
      fat: optNum(f.fat),
      tags: tags.length ? tags : undefined,
      useCount: meal.useCount ?? 0,
    });
    onClose();
  };

  const toggleArchive = async () => {
    const archived = !meal.archived;
    await db.meals.update(meal.id!, { archived });
    toast(archived ? `Archived ${meal.name}` : `Restored ${meal.name}`, () => db.meals.update(meal.id!, { archived: !archived }).then(() => {}));
    onClose();
  };

  return (
    <Modal title={meal.id ? 'Edit meal' : 'New meal'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input autoFocus={!meal.id} placeholder="Name" value={f.name} onChange={set('name')} aria-label="Name" />
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="numeric" placeholder="kcal" value={f.kcal} onChange={set('kcal')} aria-label="Calories" />
          <Input inputMode="decimal" placeholder="Protein g" value={f.protein} onChange={set('protein')} aria-label="Protein" />
          <Input inputMode="decimal" placeholder="Carbs g" value={f.carbs} onChange={set('carbs')} aria-label="Carbs" />
          <Input inputMode="decimal" placeholder="Fat g" value={f.fat} onChange={set('fat')} aria-label="Fat" />
        </div>
        <Input placeholder="Tags (breakfast, snack)" value={f.tags} onChange={set('tags')} aria-label="Tags" />
        <div className="flex gap-2">
          {meal.id != null && (
            <Button type="button" onClick={toggleArchive}>{meal.archived ? 'Unarchive' : 'Archive'}</Button>
          )}
          <Button variant="primary" className="flex-1" disabled={!valid}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
