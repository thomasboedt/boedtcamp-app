import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireClient } from "../middleware/auth";
import { lookupBarcode, searchFood } from "../lib/openFoodFacts";
import { recognizeFoodPhoto } from "../lib/nutritionAi";
import { deriveGrams } from "../lib/nutrition";

const router = Router();
router.use(requireClient);

const DEFAULT_TARGET = { kcal: 2000, pctCarbs: 45, pctProtein: 25, pctFat: 30 };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

router.get("/nutrition/targets", async (req, res) => {
  const t = await prisma.nutritionTarget.findUnique({ where: { clientId: req.clientId! } });
  const base = t ? { kcal: t.kcal, pctCarbs: t.pctCarbs, pctProtein: t.pctProtein, pctFat: t.pctFat } : DEFAULT_TARGET;
  res.json({ ...base, ...deriveGrams(base.kcal, base.pctCarbs, base.pctProtein, base.pctFat) });
});

router.get("/nutrition/day", async (req, res) => {
  const dateIso = String(req.query.date || "");
  if (!ISO_DATE.test(dateIso)) {
    res.status(400).json({ error: "Ongeldige datum." });
    return;
  }
  const entries = await prisma.foodEntry.findMany({
    where: { clientId: req.clientId, dateIso },
    orderBy: { createdAt: "asc" },
  });
  const totals = entries.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, carbs: a.carbs + e.carbs, protein: a.protein + e.protein, fat: a.fat + e.fat }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 }
  );
  res.json({ entries, totals });
});

const entryInput = z.object({
  dateIso: z.string().regex(ISO_DATE),
  meal: z.enum(["ontbijt", "lunch", "avond", "snack"]),
  naam: z.string().min(1),
  merk: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  grams: z.number().positive(),
  unit: z.number().positive().optional(),
  count: z.number().int().positive().optional(),
  kcal: z.number().min(0),
  carbs: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  bron: z.enum(["open-food-facts", "basislijst", "foto-herkenning", "handmatig"]),
});

router.post("/nutrition/entries", async (req, res) => {
  const parsed = entryInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Ongeldige invoer." });
    return;
  }
  const entry = await prisma.foodEntry.create({ data: { clientId: req.clientId!, ...parsed.data } });
  res.status(201).json(entry);
});

const entryUpdateInput = z.object({
  meal: z.enum(["ontbijt", "lunch", "avond", "snack"]).optional(),
  grams: z.number().positive().optional(),
  unit: z.number().positive().optional(),
  count: z.number().int().positive().optional(),
  kcal: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
});

router.patch("/nutrition/entries/:id", async (req, res) => {
  const existing = await prisma.foodEntry.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  const parsed = entryUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer." });
    return;
  }
  const updated = await prisma.foodEntry.update({ where: { id: existing.id }, data: parsed.data });
  res.json(updated);
});

router.delete("/nutrition/entries/:id", async (req, res) => {
  const existing = await prisma.foodEntry.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  await prisma.foodEntry.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

router.get("/nutrition/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) {
    res.json({ items: [], source: "" });
    return;
  }
  res.json(await searchFood(q));
});

router.get("/nutrition/barcode/:code", async (req, res) => {
  const product = await lookupBarcode(req.params.code);
  if (!product) {
    res.status(404).json({ error: `Barcode ${req.params.code} niet gevonden. Zoek het product op naam — je kan de waarden daarna zelf aanpassen.` });
    return;
  }
  res.json(product);
});

const photoInput = z.object({ imageBase64: z.string().min(100) });

router.post("/nutrition/photo", async (req, res) => {
  const parsed = photoInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Geen foto ontvangen." });
    return;
  }
  const result = await recognizeFoodPhoto(parsed.data.imageBase64);
  if ("error" in result) {
    res.status(422).json(result);
    return;
  }
  res.json(result);
});

export default router;
