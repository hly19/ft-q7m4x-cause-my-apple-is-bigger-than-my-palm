import { Modal } from './Modal';

export const PORTIONS = [0.5, 1, 1.5, 2];
export const portionLabel = (p: number) => ({ 0.5: '½', 1: '1', 1.5: '1½', 2: '2' })[p] ?? String(p);

export function PortionPicker({ name, kcal, onPick, onClose }: { name: string; kcal: number; onPick: (p: number) => void; onClose: () => void }) {
  return (
    <Modal title={name} onClose={onClose}>
      <div className="grid grid-cols-4 gap-2">
        {PORTIONS.map((p) => (
          <button
            key={p}
            className="min-h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 flex flex-col items-center justify-center"
            onClick={() => onPick(p)}
          >
            <span className="text-xl font-semibold">×{portionLabel(p)}</span>
            <span className="text-xs text-zinc-500">{Math.round(kcal * p)} kcal</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
