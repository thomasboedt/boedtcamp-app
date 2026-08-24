import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireTrainer } from "../middleware/auth";
import { isoAdd, isoToday } from "../lib/date";

const router = Router();
router.use(requireTrainer);

const NL_MON_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const DEFAULT_TARGET = { kcal: 2000, carbs: 220, protein: 120, fat: 70 };

const targetInput = z.object({
  kcal: z.number().int().positive(),
  carbs: z.number().int().min(0),
  protein: z.number().int().min(0),
  fat: z.number().int().min(0),
});

router.put("/clients/:id/nutrition-targets", async (req, res) => {
  const parsed = targetInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer." });
    return;
  }
  const target = await prisma.nutritionTarget.upsert({
    where: { clientId: req.params.id },
    update: parsed.data,
    create: { clientId: req.params.id, ...parsed.data },
  });
  res.json(target);
});

type EntryTotals = { kcal: number; carbs: number; protein: number; fat: number };

function sumEntries(list: { kcal: number; carbs: number; protein: number; fat: number }[]): EntryTotals {
  return list.reduce((a, e) => ({ kcal: a.kcal + e.kcal, carbs: a.carbs + e.carbs, protein: a.protein + e.protein, fat: a.fat + e.fat }), {
    kcal: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
}

router.get("/clients/:id/nutrition", async (req, res) => {
  const clientId = req.params.id;
  const period = req.query.period === "maand" || req.query.period === "jaar" ? req.query.period : "dag";
  const dayParam = String(req.query.day || "");
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : isoToday();
  const today = isoToday();

  const targetRow = await prisma.nutritionTarget.findUnique({ where: { clientId } });
  const target = targetRow ? { kcal: targetRow.kcal, carbs: targetRow.carbs, protein: targetRow.protein, fat: targetRow.fat } : DEFAULT_TARGET;

  // One query covers the widest period (12 months back) so every tab reuses it.
  const since = isoAdd(today, -370);
  const rows = await prisma.foodEntry.findMany({ where: { clientId, dateIso: { gte: since } }, orderBy: { dateIso: "asc" } });

  const byDay = new Map<string, typeof rows>();
  rows.forEach((r) => {
    const arr = byDay.get(r.dateIso) || [];
    arr.push(r);
    byDay.set(r.dateIso, arr);
  });
  const dayTotals = (iso: string) => sumEntries(byDay.get(iso) || []);

  let bars: { label: string; val: number }[] = [];
  let loggedDays: string[] = [];

  if (period === "jaar") {
    const now = new Date(today + "T12:00:00");
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthRows = rows.filter((r) => r.dateIso.startsWith(key));
      const monthDays = Array.from(new Set(monthRows.map((r) => r.dateIso)));
      const monthKcal = sumEntries(monthRows).kcal;
      bars.push({ label: NL_MON_SHORT[d.getMonth()], val: monthDays.length ? Math.round(monthKcal / monthDays.length) : 0 });
      loggedDays = loggedDays.concat(monthDays);
    }
  } else {
    const n = period === "maand" ? 30 : 14;
    const window: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const iso = isoAdd(today, -i);
      window.push(iso);
      const t = dayTotals(iso);
      const d = new Date(iso + "T12:00:00");
      bars.push({ label: n > 20 ? (d.getDate() % 5 === 0 ? String(d.getDate()) : "") : `${d.getDate()}/${d.getMonth() + 1}`, val: t.kcal });
    }
    loggedDays = window.filter((iso) => byDay.has(iso));
  }

  const totals = sumEntries(loggedDays.map((iso) => dayTotals(iso)));
  const nDays = loggedDays.length || 1;
  const avg = {
    kcal: Math.round(totals.kcal / nDays),
    carbs: Math.round(totals.carbs / nDays),
    protein: Math.round(totals.protein / nDays),
    fat: Math.round(totals.fat / nDays),
  };

  const kpis = [
    { label: "Dagen gelogd", value: String(loggedDays.length), sub: period === "jaar" ? "afgelopen 12 maanden" : `van de laatste ${period === "maand" ? 30 : 14}` },
    { label: "Gem. kcal/dag", value: String(avg.kcal), sub: `doel ${target.kcal} kcal` },
    { label: "Gem. eiwitten", value: `${avg.protein} g`, sub: `doel ${target.protein} g` },
    { label: "Gem. koolhydraten", value: `${avg.carbs} g`, sub: `doel ${target.carbs} g` },
  ];

  const splitKcal = avg.carbs * 4 + avg.protein * 4 + avg.fat * 9;
  const split = [
    { label: "Koolhydraten", val: avg.carbs, pct: splitKcal ? Math.round(((avg.carbs * 4) / splitKcal) * 100) : 0 },
    { label: "Eiwitten", val: avg.protein, pct: splitKcal ? Math.round(((avg.protein * 4) / splitKcal) * 100) : 0 },
    { label: "Vetten", val: avg.fat, pct: splitKcal ? Math.round(((avg.fat * 9) / splitKcal) * 100) : 0 },
  ];

  const dayRows = (byDay.get(day) || []).map((r) => ({
    id: r.id,
    naam: r.naam,
    meal: r.meal,
    grams: Math.round(r.grams),
    kcal: r.kcal,
    carbs: Math.round(r.carbs),
    protein: Math.round(r.protein),
    bron: r.bron,
  }));

  res.json({ target, kpis, bars, split, day, dayTotals: dayTotals(day), dayRows });
});

export default router;
