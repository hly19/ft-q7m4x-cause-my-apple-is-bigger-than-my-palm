import { useState } from 'react';
import { logCustom } from '../db/repo';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { Button, Input, optNum } from './ui';

export function CustomFoodForm({ date, onClose }: { date: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [save, setSave] = useState(false);
  const toast = useToast();
  const k = optNum(kcal);
  const valid = name.trim() !== '' && k != null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const undo = await logCustom({ name: name.trim(), kcal: Math.round(k), protein: optNum(protein), carbs: optNum(carbs), fat: optNum(fat), saveAsMeal: save }, date);
    toast(`Logged ${name.trim()}`, undo);
    onClose();
  };

  return (
    <Modal title="Add food" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input autoFocus placeholder="What did you eat?" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <Input inputMode="numeric" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} aria-label="Calories" />
        <div className="grid grid-cols-3 gap-2">
          <Input inputMode="decimal" placeholder="Protein g" value={protein} onChange={(e) => setProtein(e.target.value)} aria-label="Protein" />
          <Input inputMode="decimal" placeholder="Carbs g" value={carbs} onChange={(e) => setCarbs(e.target.value)} aria-label="Carbs" />
          <Input inputMode="decimal" placeholder="Fat g" value={fat} onChange={(e) => setFat(e.target.value)} aria-label="Fat" />
        </div>
        <p className="text-xs text-zinc-500 -mt-1">Macros optional.</p>
        <label className="flex items-center gap-3 min-h-11">
          <input type="checkbox" className="size-5 accent-emerald-600" checked={save} onChange={(e) => setSave(e.target.checked)} />
          Save as meal
        </label>
        <Button variant="primary" className="w-full" disabled={!valid}>Log it</Button>
      </form>
    </Modal>
  );
}
