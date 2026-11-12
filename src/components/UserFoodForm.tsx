import { useState } from 'react';
import { saveUserFood } from '../db/repo';
import type { UserFood } from '../db/types';
import { Modal } from './Modal';
import { Button, Input, optNum } from './ui';

/** Add or edit a food in "My foods". Values are per one unit (e.g. per bar). */
export function UserFoodForm({ food, initialName = '', onClose, onSaved }: {
  food?: UserFood;
  initialName?: string;
  onClose: () => void;
  onSaved?: (id: number) => void;
}) {
  const [f, setF] = useState({
    name: food?.name ?? initialName,
    unitLabel: food?.unitLabel ?? 'serving',
    kcal: food?.kcal?.toString() ?? '',
    protein: food?.protein?.toString() ?? '',
    carbs: food?.carbs?.toString() ?? '',
    fat: food?.fat?.toString() ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const kcal = optNum(f.kcal);
  const valid = f.name.trim() !== '' && kcal != null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const id = await saveUserFood({
      ...(food ?? {}),
      name: f.name.trim(),
      unitLabel: f.unitLabel.trim() || 'serving',
      kcal: Math.round(kcal),
      protein: optNum(f.protein),
      carbs: optNum(f.carbs),
      fat: optNum(f.fat),
    } as UserFood);
    onSaved?.(id);
    onClose();
  };

  return (
    <Modal title={food ? 'Edit my food' : 'Add a food'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input autoFocus={!food} placeholder="Name, e.g. My protein bar" value={f.name} onChange={set('name')} aria-label="Food name" />
        <label className="block text-xs text-zinc-500">One unit is a…
          <Input placeholder="bar, bowl, slice, serving" value={f.unitLabel} onChange={set('unitLabel')} aria-label="Unit" />
        </label>
        <p className="text-xs text-zinc-500 -mb-1">Per one {f.unitLabel || 'serving'} (check the label):</p>
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="numeric" placeholder="kcal" value={f.kcal} onChange={set('kcal')} aria-label="Food calories" />
          <Input inputMode="decimal" placeholder="Protein g" value={f.protein} onChange={set('protein')} aria-label="Food protein" />
          <Input inputMode="decimal" placeholder="Carbs g" value={f.carbs} onChange={set('carbs')} aria-label="Food carbs" />
          <Input inputMode="decimal" placeholder="Fat g" value={f.fat} onChange={set('fat')} aria-label="Food fat" />
        </div>
        <Button variant="primary" className="w-full" disabled={!valid}>Save food</Button>
      </form>
    </Modal>
  );
}
