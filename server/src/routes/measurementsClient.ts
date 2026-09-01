import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireClient } from "../middleware/auth";
import { deriveMeasCalc } from "../lib/measurements";

const router = Router();
router.use(requireClient);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function withCalc(m: { weight: number | null; height: number | null; waist: number | null; hip: number | null } | null) {
  if (!m) return { measurement: null, calc: deriveMeasCalc({}) };
  return { measurement: m, calc: deriveMeasCalc(m) };
}

// The date's own registration, plus (when nothing is registered yet for this
// date) the most recently known height — the client shouldn't have to
// re-enter their height every single day.
router.get("/measurements/day", async (req, res) => {
  const dateIso = String(req.query.date || "");
  if (!ISO_DATE.test(dateIso)) {
    res.status(400).json({ error: "Ongeldige datum." });
    return;
  }
  const existing = await prisma.measurement.findUnique({ where: { clientId_dateIso: { clientId: req.clientId!, dateIso } } });
  if (existing) {
    res.json(withCalc(existing));
    return;
  }
  const latest = await prisma.measurement.findFirst({
    where: { clientId: req.clientId!, dateIso: { lt: dateIso }, height: { not: null } },
    orderBy: { dateIso: "desc" },
  });
  res.json({ measurement: null, fallbackHeight: latest?.height ?? null, calc: deriveMeasCalc({}) });
});

const measurementInput = z.object({
  dateIso: z.string().regex(ISO_DATE),
  weight: z.number().positive().max(400).optional().nullable(),
  height: z.number().positive().max(260).optional().nullable(),
  fat: z.number().min(0).max(100).optional().nullable(),
  muscle: z.number().min(0).max(200).optional().nullable(),
  water: z.number().min(0).max(100).optional().nullable(),
  visceral: z.number().int().min(0).max(60).optional().nullable(),
  waist: z.number().positive().max(300).optional().nullable(),
  hip: z.number().positive().max(300).optional().nullable(),
  stress: z.number().int().min(1).max(10).optional().nullable(),
  sleep: z.number().int().min(1).max(10).optional().nullable(),
  energy: z.number().int().min(1).max(10).optional().nullable(),
});

// Partial upsert: only the fields present in the body are written, so saving
// one field on blur never clobbers the others already registered that day.
router.patch("/measurements", async (req, res) => {
  const parsed = measurementInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Ongeldige invoer." });
    return;
  }
  const { dateIso, ...fields } = parsed.data;
  const updated = await prisma.measurement.upsert({
    where: { clientId_dateIso: { clientId: req.clientId!, dateIso } },
    update: fields,
    create: { clientId: req.clientId!, dateIso, ...fields },
  });
  res.json(withCalc(updated));
});

export default router;
