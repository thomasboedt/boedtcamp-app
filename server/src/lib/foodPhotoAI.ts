import Anthropic from "@anthropic-ai/sdk";

export type FoodPhotoResult = {
  naam: string;
  hoeveelheid: number;
  eenheid: string;
  kcal: number;
  eiwit: number;
  koolhydraten: number;
  vet: number;
  toelichting: string;
};

const PROMPT = `Je krijgt een foto van een bord eten of een voedingsproduct. Schat de voedingswaarden van wat er op de foto te zien is.

Antwoord met uitsluitend een JSON-object, geen andere tekst, in exact deze vorm:
{"naam": "korte Nederlandse naam van het gerecht/product", "hoeveelheid": geschat gewicht in gram als getal, "eenheid": "g", "kcal": geschatte calorieën als getal, "eiwit": geschat eiwit in gram als getal, "koolhydraten": geschatte koolhydraten in gram als getal, "vet": geschat vet in gram als getal, "toelichting": "één korte zin in het Nederlands over hoe zeker de schatting is"}

Als je niets eetbaars herkent, gebruik dan naam "Onbekend" en zet alle getallen op 0.`;

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Geen JSON in AI-antwoord gevonden.");
  return JSON.parse(match[0]);
}

export type FoodPhotoMimeType = "image/jpeg" | "image/png" | "image/webp";

export async function analyzeFoodPhoto(base64Image: string, mimeType: FoodPhotoMimeType): Promise<FoodPhotoResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Foto-herkenning is niet geconfigureerd (ANTHROPIC_API_KEY ontbreekt).");

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Image } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Geen antwoord van AI ontvangen.");

  const parsed = extractJson(textBlock.text) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    naam: typeof parsed.naam === "string" && parsed.naam ? parsed.naam : "Onbekend",
    hoeveelheid: num(parsed.hoeveelheid) || 100,
    eenheid: typeof parsed.eenheid === "string" && parsed.eenheid ? parsed.eenheid : "g",
    kcal: num(parsed.kcal),
    eiwit: num(parsed.eiwit),
    koolhydraten: num(parsed.koolhydraten),
    vet: num(parsed.vet),
    toelichting: typeof parsed.toelichting === "string" ? parsed.toelichting : "",
  };
}
