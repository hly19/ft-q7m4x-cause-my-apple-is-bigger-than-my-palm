import { useState } from 'react';
import { logCustom } from '../db/repo';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { Button, Input, optNum } from './ui';

export function CustomFoodForm({ date, onClose }: { date: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [save, setSave] = useState(false);
  const toast = useToast();
  const k = optNum(kcal);
  const valid = name.trim() !== '' && k != null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const undo = await logCustom({ name: name.trim(), kcal: Math.round(k), protein: optNum(protein), saveAsMeal: save }, date);
    toast(`Logged ${name.trim()}`, undo);
    onClose();
  };

  return (
    <Modal title="Add food" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input autoFocus placeholder="What did you eat?" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="numeric" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} aria-label="Calories" />
          <Input inputMode="decimal" placeholder="Protein g (opt.)" value={protein} onChange={(e) => setProtein(e.target.value)} aria-label="Protein" />
        </div>
        <label className="flex items-center gap-3 min-h-11">
          <input type="checkbox" className="size-5 accent-emerald-600" checked={save} onChange={(e) => setSave(e.target.checked)} />
          Save as meal
        </label>
        <Button variant="primary" className="w-full" disabled={!valid}>Log it</Button>
      </form>
    </Modal>
  );
}
