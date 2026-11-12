import { FOODS, HAND_UNITS, type FoodDef, type FoodUnit, type Macros } from '../data/foods';

export type HandSize = 'small' | 'medium' | 'large';
export const HAND_SCALE: Record<HandSize, number> = { small: 0.8, medium: 1, large: 1.2 };

const UNIT_NAMES: Record<FoodUnit['unit'], string> = {
  g: 'g', ml: 'ml', piece: 'piece', slice: 'slice', tsp: 'tsp', tbsp: 'tbsp', cup: 'cup',
  scoop: 'scoop', can: 'can', serving: 'serving',
  palm: '✋ palm', cupped: '🤲 cupped hand', fist: '✊ fist', thumb: '👍 thumb',
};

export const isHandUnit = (u: FoodUnit) => HAND_UNITS.includes(u.unit);
export const isAmountUnit = (u: FoodUnit) => u.unit === 'g' || u.unit === 'ml';

export function unitLabel(u: FoodUnit): string {
  if (u.label) return isHandUnit(u) ? `${UNIT_NAMES[u.unit].split(' ')[0]} ${u.label}` : u.label;
  return UNIT_NAMES[u.unit];
}

/** Grams in `qty` of `unit`, scaled by hand size for hand portions. */
export function gramsFor(unit: FoodUnit, qty: number, hand: HandSize = 'medium'): number {
  return unit.grams * qty * (isHandUnit(unit) ? HAND_SCALE[hand] : 1);
}

/** Unrounded macros for one item. */
export function itemNutrition(food: FoodDef, unit: FoodUnit, qty: number, hand: HandSize = 'medium'): Macros {
  const k = gramsFor(unit, qty, hand) / 100;
  const m = food.per100g;
  return { kcal: m.kcal * k, protein: m.protein * k, carbs: m.carbs * k, fat: m.fat * k };
}

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal / 5) * 5,
    protein: Math.round(m.protein),
    carbs: Math.round(m.carbs),
    fat: Math.round(m.fat),
  };
}

/** Sum items, then round once (avoids rounding error piling up). */
export function sumMacros(items: Macros[]): Macros {
  const t = items.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return roundMacros(t);
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Ranked search: name prefix > word prefix > alias match > substring. */
export function searchFoods(query: string, foods: FoodDef[] = FOODS, limit = 20): FoodDef[] {
  const q = norm(query);
  if (!q) return [];
  const scored: [number, FoodDef][] = [];
  for (const f of foods) {
    const name = norm(f.name);
    const aliases = (f.aliases ?? []).map(norm);
    let score = 0;
    if (name.startsWith(q)) score = 4;
    else if (name.split(/[\s,/()&-]+/).some((w) => w.startsWith(q))) score = 3;
    else if (aliases.some((a) => a.startsWith(q))) score = 2;
    else if (name.includes(q) || aliases.some((a) => a.includes(q))) score = 1;
    if (score) scored.push([score, f]);
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].name.length - b[1].name.length)
    .slice(0, limit)
    .map(([, f]) => f);
}

export function fmtQty(q: number): string {
  const whole = Math.floor(q);
  const frac = q - whole;
  const f = Math.abs(frac - 0.5) < 0.01 ? '½' : Math.abs(frac - 0.25) < 0.01 ? '¼' : Math.abs(frac - 0.75) < 0.01 ? '¾' : '';
  if (f) return whole ? `${whole}${f}` : f;
  return String(Math.round(q * 100) / 100);
}
