import { describe, expect, it } from 'vitest';
import { FOODS, COMMON_KEYS, type FoodDef } from '../data/foods';
import { fmtQty, gramsFor, itemNutrition, searchFoods, sumMacros } from './nutrition';

const food = (key: string) => FOODS.find((f) => f.key === key)!;
const unit = (f: FoodDef, u: string) => f.units.find((x) => x.unit === u)!;
const one = (key: string, u: string, qty = 1, hand: 'small' | 'medium' | 'large' = 'medium') =>
  itemNutrition(food(key), unit(food(key), u), qty, hand);

describe('food data', () => {
  it('has unique keys and valid units', () => {
    const keys = FOODS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const f of FOODS) {
      expect(f.units.length, f.key).toBeGreaterThan(0);
      for (const u of f.units) expect(u.grams, `${f.key} ${u.unit}`).toBeGreaterThan(0);
    }
    for (const k of COMMON_KEYS) expect(food(k), k).toBeTruthy();
  });

  it('macros roughly match kcal (4/4/9 rule)', () => {
    for (const f of FOODS) {
      const { kcal, protein, carbs, fat } = f.per100g;
      if (f.alcohol || kcal < 60) continue;
      const est = protein * 4 + carbs * 4 + fat * 9;
      expect(Math.abs(est - kcal) / kcal, `${f.key}: ${kcal} vs ${est.toFixed(0)}`).toBeLessThan(0.15);
    }
  });
});

describe('nutrition math', () => {
  it('estimates a grilled cheese', () => {
    const t = sumMacros([one('white-bread', 'slice'), one('cheddar', 'slice'), one('butter', 'tsp')]);
    expect(t.kcal).toBeGreaterThanOrEqual(180);
    expect(t.kcal).toBeLessThanOrEqual(240);
    expect(t.protein).toBeGreaterThanOrEqual(6);
  });

  it('scales hand portions by hand size only', () => {
    expect(Math.round(one('chicken-breast', 'palm').kcal)).toBe(165);
    expect(Math.round(one('chicken-breast', 'palm', 1, 'large').kcal)).toBe(198);
    expect(Math.round(one('chicken-breast', 'palm', 1, 'small').kcal)).toBe(132);
    // non-hand units ignore hand size
    expect(one('egg', 'piece', 1, 'large').kcal).toBeCloseTo(one('egg', 'piece').kcal, 5);
    expect(gramsFor({ unit: 'g', grams: 1 }, 150, 'large')).toBe(150);
  });

  it('knows a palm of beef is more than a palm of chicken', () => {
    expect(one('ground-beef-80', 'palm').kcal).toBeGreaterThan(one('chicken-breast', 'palm').kcal + 50);
  });

  it('multiplies by quantity', () => {
    expect(one('egg', 'piece', 2).kcal).toBeCloseTo(one('egg', 'piece').kcal * 2, 5);
  });

  it('rounds totals once', () => {
    expect(sumMacros([{ kcal: 71.4, protein: 2.4, carbs: 0.4, fat: 0.4 }, { kcal: 71.4, protein: 2.4, carbs: 0.4, fat: 0.4 }])).toEqual({
      kcal: 145, protein: 5, carbs: 1, fat: 1,
    });
  });
});

describe('search', () => {
  it('ranks name prefix first and matches aliases', () => {
    expect(searchFoods('chick')[0].key).toMatch(/^chicken|chickpeas/);
    expect(searchFoods('bread').map((f) => f.key)).toContain('white-bread');
    expect(searchFoods('cheese').map((f) => f.key)).toEqual(expect.arrayContaining(['cheddar', 'mozzarella']));
    expect(searchFoods('coke').map((f) => f.key)).toContain('soda');
    expect(searchFoods('')).toEqual([]);
    expect(searchFoods('Crème')).toEqual(searchFoods('creme'));
  });
});

it('formats quantities', () => {
  expect([fmtQty(0.5), fmtQty(1), fmtQty(1.5), fmtQty(2.25), fmtQty(150)]).toEqual(['½', '1', '1½', '2¼', '150']);
});
