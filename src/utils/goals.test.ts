import { describe, expect, it } from 'vitest';
import { bmr, calcTargets, isCompleteProfile, type Profile } from './goals';

const base: Profile = { sex: 'female', age: 35, heightCm: 165, weightKg: 65, activity: 'light', goal: 'recomp' };

describe('goal calculator', () => {
  it('computes Mifflin-St Jeor BMR', () => {
    expect(bmr(base)).toBeCloseTo(10 * 65 + 6.25 * 165 - 5 * 35 - 161, 5); // 1345.25
    expect(bmr({ ...base, sex: 'male' })).toBeCloseTo(1511.25, 5);
  });

  it('suggests recomposition targets', () => {
    const t = calcTargets(base);
    expect(t.maintenance).toBe(1850); // 1345.25 × 1.375
    expect(t.kcal).toBe(1650);
    expect(t.protein).toBe(130);
    expect(t.fat).toBe(50);
    // macros add up to roughly the kcal target
    expect(Math.abs(t.protein * 4 + t.fat * 9 + t.carbs * 4 - t.kcal)).toBeLessThanOrEqual(20);
  });

  it('applies goal deltas and protein levels', () => {
    expect(calcTargets({ ...base, goal: 'maintain' }).kcal).toBe(1850);
    expect(calcTargets({ ...base, goal: 'lose' }).kcal).toBe(1450);
    expect(calcTargets({ ...base, goal: 'maintain' }).protein).toBe(105);
  });

  it('never goes below the calorie floor or negative carbs', () => {
    const t = calcTargets({ ...base, age: 80, heightCm: 145, weightKg: 42, activity: 'sedentary', goal: 'lose' });
    expect(t.kcal).toBe(1200);
    expect(t.carbs).toBeGreaterThanOrEqual(0);
  });

  it('checks profile completeness', () => {
    expect(isCompleteProfile(base)).toBe(true);
    expect(isCompleteProfile({ ...base, age: 0 })).toBe(false);
    expect(isCompleteProfile(undefined)).toBe(false);
  });
});
