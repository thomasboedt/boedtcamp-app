// Thin client for the Open Food Facts public API (world.openfoodfacts.org),
// used to look up nutrition facts by product search or barcode. Free, no API
// key, but their usage policy asks for a descriptive User-Agent.
const USER_AGENT = `BoedtCamp/1.0 (${process.env.WEB_ORIGIN || "https://boedtcamp.netlify.app"})`;

export type FoodProduct = {
  naam: string;
  merk: string | null;
  code: string;
  kcalPer100g: number | null;
  eiwitPer100g: number | null;
  koolhydratenPer100g: number | null;
  vetPer100g: number | null;
  afbeelding: string | null;
};

function toProduct(p: any): FoodProduct | null {
  const naam = p.product_name || p.product_name_nl || p.product_name_en;
  if (!naam) return null;
  const n = p.nutriments || {};
  return {
    naam,
    merk: p.brands ? p.brands.split(",")[0].trim() : null,
    code: p.code || p._id || "",
    kcalPer100g: typeof n["energy-kcal_100g"] === "number" ? n["energy-kcal_100g"] : null,
    eiwitPer100g: typeof n.proteins_100g === "number" ? n.proteins_100g : null,
    koolhydratenPer100g: typeof n.carbohydrates_100g === "number" ? n.carbohydrates_100g : null,
    vetPer100g: typeof n.fat_100g === "number" ? n.fat_100g : null,
    afbeelding: p.image_small_url || null,
  };
}

const FIELDS = "product_name,product_name_nl,product_name_en,brands,code,nutriments,image_small_url";

export async function searchFood(query: string): Promise<FoodProduct[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Open Food Facts search faalde (${res.status}).`);
  const data = (await res.json()) as { products?: unknown[] };
  return (data.products || []).map(toProduct).filter((p): p is FoodProduct => p !== null && p.kcalPer100g !== null);
}

export async function lookupBarcode(code: string): Promise<FoodProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Open Food Facts opzoeken faalde (${res.status}).`);
  const data = (await res.json()) as { status?: number; product?: unknown };
  if (data.status !== 1 || !data.product) return null;
  const product = toProduct({ ...(data.product as object), code });
  return product;
}
