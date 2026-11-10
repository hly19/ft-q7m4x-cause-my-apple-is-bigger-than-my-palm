// Target suggestions. Mifflin-St Jeor BMR × activity, then a goal adjustment.
// Rough by design (~80% accuracy); tune with the weight/body-fat trend over 2–3 weeks.

export type Sex = 'female' | 'male';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very';
export type Goal = 'lose' | 'recomp' | 'maintain';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

export const ACTIVITY: Record<Activity, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary', hint: 'Desk job, under ~5k steps' },
  light: { factor: 1.375, label: 'Light', hint: '5–8k steps or 1–3 workouts/week' },
  moderate: { factor: 1.55, label: 'Moderate', hint: '8–12k steps or 3–5 workouts/week' },
  very: { factor: 1.725, label: 'Very active', hint: '12k+ steps or hard training most days' },
};

export const GOALS: Record<Goal, { label: string; hint: string; kcalDelta: number; proteinPerKg: number }> = {
  lose: { label: 'Lose fat', hint: '~400 kcal below maintenance', kcalDelta: -400, proteinPerKg: 2.0 },
  recomp: { label: 'Recomposition', hint: 'Lose fat, build muscle. Small deficit, high protein', kcalDelta: -200, proteinPerKg: 2.0 },
  maintain: { label: 'Maintain', hint: 'Hold weight', kcalDelta: 0, proteinPerKg: 1.6 },
};

const FAT_PER_KG = 0.8;
const KCAL_FLOOR: Record<Sex, number> = { female: 1200, male: 1500 };

export interface Targets {
  bmr: number;
  maintenance: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export function bmr(p: Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
}

const round = (n: number, step: number) => Math.round(n / step) * step;

export function calcTargets(p: Profile): Targets {
  const b = bmr(p);
  const maintenance = b * ACTIVITY[p.activity].factor;
  const g = GOALS[p.goal];
  const kcal = round(Math.max(KCAL_FLOOR[p.sex], maintenance + g.kcalDelta), 10);
  const protein = round(p.weightKg * g.proteinPerKg, 5);
  const fat = round(p.weightKg * FAT_PER_KG, 5);
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4, 5));
  return { bmr: Math.round(b), maintenance: round(maintenance, 10), kcal, protein, fat, carbs };
}

export function isCompleteProfile(p: Partial<Profile> | undefined): p is Profile {
  return !!p && !!p.sex && !!p.activity && !!p.goal && [p.age, p.heightCm, p.weightKg].every((n) => typeof n === 'number' && n > 0);
}

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
