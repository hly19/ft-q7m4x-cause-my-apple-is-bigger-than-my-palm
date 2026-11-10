import { useState } from 'react';
import { updateDay } from '../db/repo';
import { inputCls, optNum } from './ui';

// Parent remounts this via `key` when the date or stored value changes.
export function StepsInput({ date, steps }: { date: string; steps?: number }) {
  const [value, setValue] = useState(steps?.toString() ?? '');

  const save = () => {
    const n = optNum(value);
    const v = n == null ? undefined : Math.round(n);
    if (v !== steps) updateDay(date, { steps: v });
  };

  return (
    <label className="flex items-center gap-3">
      <span className="w-20 font-medium">Steps</span>
      <input
        className={inputCls}
        inputMode="numeric"
        placeholder="0"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}
