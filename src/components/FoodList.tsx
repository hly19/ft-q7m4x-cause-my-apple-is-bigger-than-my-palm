import { useState } from 'react';
import { deleteRecord, updateFoodEntry } from '../db/repo';
import type { FoodEntry } from '../db/types';
import { Modal } from './Modal';
import { PORTIONS, portionLabel } from './PortionPicker';
import { useToast } from './Toast';
import { Button, Input, optNum } from './ui';

export function FoodList({ entries }: { entries: FoodEntry[] }) {
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const toast = useToast();

  const remove = async (e: FoodEntry) => {
    const undo = await deleteRecord('foodEntries', e.id!);
    toast(`Deleted ${e.name}`, undo);
  };

  if (entries.length === 0) return <p className="text-sm text-zinc-500 py-2">Nothing logged yet.</p>;

  return (
    <>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center">
            <button className="flex-1 min-h-12 flex items-center gap-3 text-left py-2" onClick={() => setEditing(e)}>
              <span className="text-xs text-zinc-500 w-10 tabular-nums">{e.time}</span>
              <span className="flex-1">
                {e.name}
                {e.portion !== 1 && <span className="text-zinc-500"> ×{portionLabel(e.portion)}</span>}
              </span>
              <span className="tabular-nums text-sm">{Math.round(e.kcal * e.portion)}</span>
            </button>
            <button className="min-h-11 min-w-11 text-zinc-400 hover:text-red-600" onClick={() => remove(e)} aria-label={`Delete ${e.name}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      {editing && <EditEntry entry={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditEntry({ entry, onClose }: { entry: FoodEntry; onClose: () => void }) {
  const [f, setF] = useState({
    name: entry.name,
    kcal: String(entry.kcal),
    protein: entry.protein?.toString() ?? '',
    carbs: entry.carbs?.toString() ?? '',
    fat: entry.fat?.toString() ?? '',
    time: entry.time,
    portion: entry.portion,
    note: entry.note ?? '',
  });
  const toast = useToast();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const kcal = optNum(f.kcal);
  const valid = f.name.trim() !== '' && kcal != null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const undo = await updateFoodEntry(entry.id!, {
      name: f.name.trim(),
      kcal: Math.round(kcal),
      protein: optNum(f.protein),
      carbs: optNum(f.carbs),
      fat: optNum(f.fat),
      time: f.time || entry.time,
      portion: f.portion,
      note: f.note.trim() || undefined,
    });
    toast('Entry updated', undo);
    onClose();
  };

  return (
    <Modal title="Edit entry" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Input value={f.name} onChange={set('name')} aria-label="Name" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-zinc-500">kcal per portion<Input inputMode="numeric" value={f.kcal} onChange={set('kcal')} /></label>
          <label className="text-xs text-zinc-500">Time<Input type="time" value={f.time} onChange={set('time')} /></label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-zinc-500">Protein g<Input inputMode="decimal" value={f.protein} onChange={set('protein')} /></label>
          <label className="text-xs text-zinc-500">Carbs g<Input inputMode="decimal" value={f.carbs} onChange={set('carbs')} /></label>
          <label className="text-xs text-zinc-500">Fat g<Input inputMode="decimal" value={f.fat} onChange={set('fat')} /></label>
        </div>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Portion">
          {PORTIONS.map((p) => (
            <button
              type="button"
              key={p}
              role="radio"
              aria-checked={f.portion === p}
              onClick={() => setF({ ...f, portion: p })}
              className={`min-h-11 rounded-lg ${f.portion === p ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              ×{portionLabel(p)}
            </button>
          ))}
        </div>
        <Input placeholder="Note" value={f.note} onChange={set('note')} aria-label="Note" />
        <Button variant="primary" className="w-full" disabled={!valid}>Save</Button>
      </form>
    </Modal>
  );
}
