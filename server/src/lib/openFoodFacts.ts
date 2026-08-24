// Server-side Open Food Facts client. Runs on the server (not the browser) so
// there's no CORS dependency on the client's network, and so a network hiccup
// degrades to the curated fallback list below instead of a broken UI.
// Nutrient values are per 100g/ml, matching Open Food Facts' own convention;
// callers scale to the logged portion.

export type FoodProduct = {
  code: string;
  naam: string;
  merk: string;
  kcal100: number;
  carbs100: number;
  protein100: number;
  fat100: number;
  defaultGrams: number;
  bron: "open-food-facts" | "basislijst";
};

const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_PRODUCT = "https://world.openfoodfacts.org/api/v2/product/";
const FETCH_TIMEOUT_MS = 6000;

const FALLBACK_FOODS: FoodProduct[] = [
  { code: "5410041000122", naam: "Volkorenbrood", merk: "Bakkerij", kcal100: 247, carbs100: 41, protein100: 9, fat100: 3.5, defaultGrams: 35, bron: "basislijst" },
  { code: "3017620422003", naam: "Choco-notenpasta", merk: "Spread", kcal100: 539, carbs100: 57, protein100: 6.3, fat100: 31, defaultGrams: 15, bron: "basislijst" },
  { code: "5411188110781", naam: "Griekse yoghurt 0%", merk: "Zuivel", kcal100: 59, carbs100: 3.6, protein100: 10, fat100: 0.4, defaultGrams: 150, bron: "basislijst" },
  { code: "", naam: "Havermout", merk: "", kcal100: 372, carbs100: 60, protein100: 13, fat100: 7, defaultGrams: 40, bron: "basislijst" },
  { code: "", naam: "Banaan", merk: "", kcal100: 89, carbs100: 23, protein100: 1.1, fat100: 0.3, defaultGrams: 120, bron: "basislijst" },
  { code: "", naam: "Kipfilet gebakken", merk: "", kcal100: 165, carbs100: 0, protein100: 31, fat100: 3.6, defaultGrams: 150, bron: "basislijst" },
  { code: "", naam: "Zalmfilet", merk: "", kcal100: 208, carbs100: 0, protein100: 20, fat100: 13, defaultGrams: 125, bron: "basislijst" },
  { code: "", naam: "Ei gekookt", merk: "", kcal100: 143, carbs100: 0.7, protein100: 12.6, fat100: 9.5, defaultGrams: 110, bron: "basislijst" },
  { code: "", naam: "Volle melk", merk: "", kcal100: 64, carbs100: 4.7, protein100: 3.4, fat100: 3.6, defaultGrams: 250, bron: "basislijst" },
  { code: "", naam: "Magere kwark", merk: "", kcal100: 68, carbs100: 4, protein100: 11, fat100: 0.3, defaultGrams: 200, bron: "basislijst" },
  { code: "", naam: "Amandelen", merk: "", kcal100: 579, carbs100: 22, protein100: 21, fat100: 50, defaultGrams: 25, bron: "basislijst" },
  { code: "", naam: "Olijfolie", merk: "", kcal100: 884, carbs100: 0, protein100: 0, fat100: 100, defaultGrams: 10, bron: "basislijst" },
  { code: "", naam: "Aardappelen gekookt", merk: "", kcal100: 87, carbs100: 20, protein100: 2, fat100: 0.1, defaultGrams: 250, bron: "basislijst" },
  { code: "", naam: "Bruine rijst gekookt", merk: "", kcal100: 123, carbs100: 26, protein100: 2.7, fat100: 1, defaultGrams: 200, bron: "basislijst" },
  { code: "", naam: "Broccoli", merk: "", kcal100: 34, carbs100: 7, protein100: 2.8, fat100: 0.4, defaultGrams: 200, bron: "basislijst" },
  { code: "", naam: "Gouda kaas", merk: "", kcal100: 356, carbs100: 2.2, protein100: 25, fat100: 27, defaultGrams: 30, bron: "basislijst" },
  { code: "", naam: "Whey proteïne", merk: "", kcal100: 380, carbs100: 6, protein100: 78, fat100: 5, defaultGrams: 30, bron: "basislijst" },
  { code: "", naam: "Speculoos", merk: "", kcal100: 460, carbs100: 70, protein100: 5.5, fat100: 17, defaultGrams: 20, bron: "basislijst" },
  { code: "", naam: "Pistolet wit", merk: "", kcal100: 271, carbs100: 51, protein100: 9, fat100: 2.5, defaultGrams: 60, bron: "basislijst" },
  { code: "", naam: "Appel", merk: "", kcal100: 52, carbs100: 14, protein100: 0.3, fat100: 0.2, defaultGrams: 150, bron: "basislijst" },
];

export const DEMO_BARCODES = FALLBACK_FOODS.filter((f) => f.code).map((f) => f.code);

function round1(v: unknown): number {
  return Math.round((Number(v) || 0) * 10) / 10;
}

function normProduct(p: Record<string, unknown>): FoodProduct | null {
  const n = (p.nutriments || {}) as Record<string, unknown>;
  const kcal100 = Math.round(Number(n["energy-kcal_100g"]) || 0);
  const naam = (p.product_name_nl as string) || (p.product_name as string) || "";
  if (!kcal100 || !naam) return null;
  return {
    code: (p.code as string) || "",
    naam,
    merk: ((p.brands as string) || "").split(",")[0].trim(),
    kcal100,
    carbs100: round1(n.carbohydrates_100g),
    protein100: round1(n.proteins_100g),
    fat100: round1(n.fat_100g),
    defaultGrams: 100,
    bron: "open-food-facts",
  };
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function searchFood(q: string): Promise<{ items: FoodProduct[]; source: string }> {
  const url =
    `${OFF_SEARCH}?search_simple=1&action=process&json=1&page_size=20` +
    `&fields=code,product_name,product_name_nl,brands,nutriments&search_terms=${encodeURIComponent(q)}`;
  const j = await fetchJson(url);
  const products = (j && (j.products as Record<string, unknown>[])) || [];
  const items = products.map(normProduct).filter((x): x is FoodProduct => x !== null);
  if (items.length) {
    return { items: items.slice(0, 20), source: `Open Food Facts · ${items.length} resultaten` };
  }
  const t = q.toLowerCase();
  const local = FALLBACK_FOODS.filter((f) => (f.naam + " " + f.merk).toLowerCase().includes(t));
  return {
    items: local,
    source: local.length
      ? (j ? "Niets gevonden in Open Food Facts — eigen basislijst" : "Open Food Facts niet bereikbaar — eigen basislijst")
      : "Niets gevonden",
  };
}

export async function lookupBarcode(code: string): Promise<FoodProduct | null> {
  const url = `${OFF_PRODUCT}${encodeURIComponent(code)}.json?fields=code,product_name,product_name_nl,brands,nutriments`;
  const j = await fetchJson(url);
  if (j && j.status === 1 && j.product) {
    const prod = normProduct(j.product as Record<string, unknown>);
    if (prod) return prod;
  }
  return FALLBACK_FOODS.find((f) => f.code === code) || null;
}
