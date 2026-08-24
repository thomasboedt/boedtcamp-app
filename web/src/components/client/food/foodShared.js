export const MEALS = [
  { id: "ontbijt", nl: "Ontbijt" },
  { id: "lunch", nl: "Lunch" },
  { id: "avond", nl: "Avondeten" },
  { id: "snack", nl: "Tussendoor" },
];

// A few Open Food Facts barcodes that resolve even when the network is
// blocked, since lookupBarcode() falls back to the curated local list for
// these exact codes — handy as one-tap examples in the scan screen.
export const DEMO_BARCODES = ["5410041000122", "3017620422003", "5411188110781"];

export function suggestMeal() {
  const h = new Date().getHours();
  if (h < 10) return "ontbijt";
  if (h < 14) return "lunch";
  if (h < 17) return "snack";
  return "avond";
}

export function round1(v) {
  return Math.round((Number(v) || 0) * 10) / 10;
}

// Scales a product's per-100g values to a portion in grams.
export function scaleToGrams(per100, grams) {
  const f = (v) => round1(((Number(v) || 0) * grams) / 100);
  return {
    kcal: Math.round(((Number(per100.kcal100) || 0) * grams) / 100),
    carbs: f(per100.carbs100),
    protein: f(per100.protein100),
    fat: f(per100.fat100),
  };
}

export function isoToday() {
  return new Date().toLocaleDateString("en-CA");
}

export function isoAdd(iso, days) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

export function nlDateLabel(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}
