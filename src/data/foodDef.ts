// Shared food types + helper (kept separate to avoid an import cycle between foods.ts and dishes.ts).

export type UnitKey =
  | 'g' | 'ml' | 'piece' | 'slice' | 'tsp' | 'tbsp' | 'cup' | 'scoop' | 'can' | 'serving'
  | 'palm' | 'cupped' | 'fist' | 'thumb';

export const HAND_UNITS: UnitKey[] = ['palm', 'cupped', 'fist', 'thumb'];

export interface FoodUnit {
  unit: UnitKey;
  grams: number;   // grams (or ml) in ONE unit, for a medium hand where relevant
  label?: string;  // overrides the default unit name, e.g. "glass (5 oz)"
}

export type Category = 'protein' | 'dairy' | 'carb' | 'veg' | 'fruit' | 'fat' | 'drink' | 'snack' | 'mixed' | 'dish';

export interface Macros { kcal: number; protein: number; carbs: number; fat: number }

export interface FoodDef {
  key: string;
  name: string;
  category: Category;
  per100g: Macros;
  units: FoodUnit[];   // first one is the default
  aliases?: string[];
  alcohol?: boolean;   // kcal includes alcohol (7 kcal/g), so 4/4/9 doesn't add up
}

export type U = [UnitKey, number, string?];

export function f(key: string, name: string, category: Category, m: [number, number, number, number], units: U[], aliases?: string[], extra?: Partial<FoodDef>): FoodDef {
  return {
    key,
    name,
    category,
    per100g: { kcal: m[0], protein: m[1], carbs: m[2], fat: m[3] },
    units: units.map(([unit, grams, label]) => ({ unit, grams, ...(label ? { label } : {}) })),
    ...(aliases ? { aliases } : {}),
    ...extra,
  };
}

export const PALM: U = ['palm', 100];
export const G: U = ['g', 1];
export const ML: U = ['ml', 1];
export const booze = { alcohol: true };
