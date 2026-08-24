// Photo-based food recognition: the client already tries to read a barcode off
// the photo itself (browser BarcodeDetector); this only runs when that fails,
// i.e. for a plated meal rather than a packaged product. The key never reaches
// the frontend — this call happens server-side only.

export type AiFoodItem = {
  naam: string;
  gram: number;
  kcal: number;
  koolhydraten: number;
  eiwitten: number;
  vetten: number;
};

type AiTotal = { kcal: number; koolhydraten: number; eiwitten: number; vetten: number };

type AiResult = { items: AiFoodItem[]; total: AiTotal | null; confidence: string } | { error: string };

const PROMPT =
  'Identificeer de voedingsmiddelen op deze foto, schat de portiegrootte in gram, en geef terug als JSON: ' +
  '{"items":[{"naam":"","gram":0,"kcal":0,"eiwitten":0,"koolhydraten":0,"vetten":0}],' +
  '"totaal":{"kcal":0,"eiwitten":0,"koolhydraten":0,"vetten":0},"zekerheid":"hoog|matig|laag"}. ' +
  "Gebruik Nederlandse namen. Alle waarden gelden voor de geschatte portie, niet per 100 gram. Rond af op hele getallen. Geef enkel de JSON terug.";

export async function recognizeFoodPhoto(imageBase64: string): Promise<AiResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "Beeldherkenning is niet ingesteld op de server (ANTHROPIC_API_KEY ontbreekt)." };
  }

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1400,
        system: "Je bent een Vlaamse voedingsdeskundige. Je antwoordt uitsluitend met geldige JSON, zonder uitleg en zonder code-fences.",
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return { error: "De beeldherkenning gaf geen antwoord. Probeer opnieuw of zoek het product op naam." };
  }

  if (!res.ok) {
    return { error: `De beeldherkenning gaf geen antwoord (fout ${res.status}).` };
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const raw = (data.content || []).map((b) => b.text || "").join("");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) {
    return { error: "Er werd geen voeding herkend op deze foto. Zoek het product op naam." };
  }

  let parsed: { items?: AiFoodItem[]; totaal?: AiTotal; zekerheid?: string };
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { error: "Er werd geen voeding herkend op deze foto. Zoek het product op naam." };
  }

  const items = (parsed.items || []).filter((i) => i && i.naam);
  if (!items.length) {
    return { error: "Er werd geen voeding herkend op deze foto. Zoek het product op naam." };
  }
  return { items, total: parsed.totaal || null, confidence: parsed.zekerheid || "" };
}
