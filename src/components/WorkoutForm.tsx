import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db/db';
import { addWorkout, deleteRecord } from '../db/repo';
import type { Intensity, Workout } from '../db/types';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { Button, Input, optNum } from './ui';

const DEFAULT_TYPES = ['Walk', 'Run', 'Weights', 'Bike', 'Swim', 'Yoga', 'HIIT'];
const INTENSITIES: Intensity[] = ['easy', 'medium', 'hard'];

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const toast = useToast();
  if (workouts.length === 0) return null;
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {workouts.map((w) => (
        <li key={w.id} className="flex items-center min-h-12">
          <span className="flex-1">
            <span className="font-medium">{w.type}</span>
            <span className="text-sm text-zinc-500">
              {w.durationMin != null && ` · ${w.durationMin} min`}
              {w.intensity && ` · ${w.intensity}`}
            </span>
          </span>
          <button
            className="min-h-11 min-w-11 text-zinc-400 hover:text-red-600"
            aria-label={`Delete ${w.type}`}
            onClick={async () => toast(`Deleted ${w.type}`, await deleteRecord('workouts', w.id!))}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}

export function WorkoutForm({ date, onClose }: { date: string; onClose: () => void }) {
  const recent = useLiveQuery(async () => {
    const all = await db.workouts.orderBy('date').reverse().limit(100).toArray();
    return [...new Set([...all.map((w) => w.type), ...DEFAULT_TYPES])].slice(0, 8);
  }, []);
  const [type, setType] = useState('');
  const [min, setMin] = useState('');
  const [intensity, setIntensity] = useState<Intensity | undefined>();
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim()) return;
    const t = type.trim();
    const undo = await addWorkout({ date, type: t, durationMin: optNum(min), intensity });
    toast(`Logged ${t}`, undo);
    onClose();
  };

  return (
    <Modal title="Add workout" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(recent ?? DEFAULT_TYPES).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`min-h-11 px-3 rounded-full ${type === t ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <Input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Workout type" />
        <Input inputMode="numeric" placeholder="Minutes (opt.)" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minutes" />
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Intensity">
          {INTENSITIES.map((i) => (
            <button
              type="button"
              key={i}
              role="radio"
              aria-checked={intensity === i}
              onClick={() => setIntensity(intensity === i ? undefined : i)}
              className={`min-h-11 rounded-lg capitalize ${intensity === i ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <Button variant="primary" className="w-full" disabled={!type.trim()}>Log workout</Button>
      </form>
    </Modal>
  );
}
