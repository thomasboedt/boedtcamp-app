// Macro targets are stored as a % split of kcal (carbs/protein at 4 kcal/g,
// fat at 9 kcal/g) rather than absolute grams — this derives grams wherever
// a display needs them, so the split stays the single source of truth.
export function deriveGrams(kcal: number, pctCarbs: number, pctProtein: number, pctFat: number) {
  return {
    carbs: Math.round(((kcal * pctCarbs) / 100 / 4) * 10) / 10,
    protein: Math.round(((kcal * pctProtein) / 100 / 4) * 10) / 10,
    fat: Math.round(((kcal * pctFat) / 100 / 9) * 10) / 10,
  };
}
