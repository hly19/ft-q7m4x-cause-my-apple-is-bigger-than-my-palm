import { useState } from 'react';
import { updateSettings } from '../db/repo';
import type { Settings } from '../db/types';
import { ACTIVITY, calcTargets, GOALS, isCompleteProfile, KG_PER_LB, type Activity, type Goal, type Profile, type Sex } from '../utils/goals';
import { useToast } from './Toast';
import { Button, inputCls, optNum } from './ui';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function GoalCalculator({ settings }: { settings: Settings }) {
  const p = settings.profile ?? {};
  const toast = useToast();
  const [sex, setSex] = useState<Sex | undefined>(p.sex);
  const [age, setAge] = useState(p.age?.toString() ?? '');
  const [weight, setWeight] = useState(p.weightKg ? String(r1(p.weightKg / KG_PER_LB)) : '');
  const [cm, setCm] = useState(p.heightCm?.toString() ?? '');
  const [activity, setActivity] = useState<Activity>(p.activity ?? 'light');
  const [goal, setGoal] = useState<Goal>(p.goal ?? 'recomp');

  const w = optNum(weight);
  const heightCm = optNum(cm);
  const profile: Partial<Profile> = {
    sex,
    age: optNum(age),
    heightCm: heightCm ? r1(heightCm) : undefined,
    weightKg: w ? r1(w * KG_PER_LB) : undefined,
    activity,
    goal,
  };
  const t = isCompleteProfile(profile) ? calcTargets(profile) : null;

  const apply = async () => {
    if (!t) return;
    const prev = {
      profile: settings.profile,
      kcalTarget: settings.kcalTarget,
      proteinTarget: settings.proteinTarget,
      carbsTarget: settings.carbsTarget,
      fatTarget: settings.fatTarget,
    };
    await updateSettings({ profile, kcalTarget: t.kcal, proteinTarget: t.protein, carbsTarget: t.carbs, fatTarget: t.fat });
    toast('Targets updated', () => updateSettings(prev));
  };

  const chip = (on: boolean) => `min-h-11 rounded-lg ${on ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Sex">
        {(['female', 'male'] as const).map((s) => (
          <button key={s} type="button" role="radio" aria-checked={sex === s} className={`${chip(sex === s)} capitalize`} onClick={() => setSex(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-zinc-500">Age
          <input className={inputCls} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="text-xs text-zinc-500">Height cm
          <input className={inputCls} inputMode="numeric" value={cm} onChange={(e) => setCm(e.target.value)} />
        </label>
        <label className="text-xs text-zinc-500">Weight lb
          <input className={inputCls} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
      </div>
      <label className="block text-xs text-zinc-500">Activity (steps + training)
        <select className={inputCls} value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
          {Object.entries(ACTIVITY).map(([k, a]) => (
            <option key={k} value={k}>{a.label}: {a.hint}</option>
          ))}
        </select>
      </label>
      <div className="space-y-1" role="radiogroup" aria-label="Goal">
        {Object.entries(GOALS).map(([k, g]) => (
          <label key={k} className="flex items-start gap-3 min-h-11">
            <input type="radio" name="goal" className="mt-1 size-5 accent-emerald-600" checked={goal === k} onChange={() => setGoal(k as Goal)} />
            <span>
              <b>{g.label}</b>
              <span className="block text-xs text-zinc-500">{g.hint}</span>
            </span>
          </label>
        ))}
      </div>

      {t ? (
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-3 space-y-2">
          <p className="text-xs text-zinc-500">Estimated maintenance ≈ {t.maintenance.toLocaleString()} kcal/day</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['kcal', t.kcal.toLocaleString()],
              ['Protein', `${t.protein}g`],
              ['Carbs', `${t.carbs}g`],
              ['Fat', `${t.fat}g`],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-xs text-zinc-500">{l}</div>
                <div className="font-semibold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
          <Button variant="primary" className="w-full" onClick={apply}>Use these targets</Button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Fill in all fields to see suggested targets.</p>
      )}
      <p className="text-xs text-zinc-500">
        Estimates only, not medical advice. Check your weight and body-fat trend after 2–3 weeks and adjust kcal by 100–200.
        For recomposition, strength training 2–4×/week matters as much as food.
      </p>
    </div>
  );
}
