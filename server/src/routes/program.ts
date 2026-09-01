import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireTrainer } from "../middleware/auth";

const router = Router();
router.use(requireTrainer);

const BLOCKS = ["warmup", "main", "cooldown"] as const;

router.get("/clients/:id/days", async (req, res) => {
  const days = await prisma.programDay.findMany({
    where: { clientId: req.params.id },
    orderBy: { volgorde: "asc" },
    include: { items: { orderBy: { volgorde: "asc" } } },
  });
  res.json(days);
});

router.post("/clients/:id/days", async (req, res) => {
  const clientId = req.params.id;
  const max = await prisma.programDay.aggregate({ where: { clientId }, _max: { volgorde: true } });
  const volgorde = (max._max.volgorde || 0) + 1;
  const day = await prisma.programDay.create({
    data: { clientId, volgorde, titel: `Training ${volgorde}` },
  });
  res.status(201).json(day);
});

const dayUpdateInput = z.object({
  titel: z.string().min(1).optional(),
  rotate: z.boolean().optional(),
  rowing: z.boolean().optional(),
  rowBase: z.number().positive().optional(),
  rowPct: z.number().min(0).optional(),
  rowWeek: z.number().int().min(0).optional(),
});

router.patch("/days/:dayId", async (req, res) => {
  const parsed = dayUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer." });
    return;
  }
  const day = await prisma.programDay.update({ where: { id: req.params.dayId }, data: parsed.data });
  res.json(day);
});

router.delete("/days/:dayId", async (req, res) => {
  await prisma.programDay.delete({ where: { id: req.params.dayId } });
  res.json({ ok: true });
});

router.post("/days/:dayId/reroll-pool", async (req, res) => {
  const day = await prisma.programDay.update({
    where: { id: req.params.dayId },
    data: { poolShift: { increment: 1 } },
  });
  res.json(day);
});

const itemInput = z.object({
  naam: z.string().min(1),
  block: z.enum(BLOCKS).default("main"),
  type: z.enum(["reps", "time"]).default("reps"),
  unit: z.string().optional().nullable(),
  sets: z.number().int().positive().default(3),
  repsOfSec: z.number().positive().default(10),
  doelgewicht: z.number().min(0).default(0),
  restSec: z.number().int().min(0).default(90),
  videoUrl: z.string().optional().nullable(),
  notitie: z.string().optional().nullable(),
  bron: z.string().default("eigen"),
});

router.post("/days/:dayId/items", async (req, res) => {
  const parsed = itemInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Ongeldige invoer." });
    return;
  }
  const dayId = req.params.dayId;
  const max = await prisma.programItem.aggregate({ where: { dayId }, _max: { volgorde: true } });
  const item = await prisma.programItem.create({
    data: { ...parsed.data, dayId, volgorde: (max._max.volgorde || 0) + 1 },
  });
  res.status(201).json(item);
});

const itemUpdateInput = z.object({
  naam: z.string().min(1).optional(),
  block: z.enum(BLOCKS).optional(),
  sets: z.number().int().positive().optional(),
  repsOfSec: z.number().positive().optional(),
  doelgewicht: z.number().min(0).optional(),
  restSec: z.number().int().min(0).optional(),
  videoUrl: z.string().optional().nullable(),
});

router.patch("/items/:itemId", async (req, res) => {
  const parsed = itemUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer." });
    return;
  }
  const item = await prisma.programItem.update({ where: { id: req.params.itemId }, data: parsed.data });
  res.json(item);
});

router.delete("/items/:itemId", async (req, res) => {
  await prisma.programItem.delete({ where: { id: req.params.itemId } });
  res.json({ ok: true });
});

router.post("/items/:itemId/move", async (req, res) => {
  const schema = z.object({ direction: z.union([z.literal(-1), z.literal(1)]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige richting." });
    return;
  }
  const item = await prisma.programItem.findUnique({ where: { id: req.params.itemId } });
  if (!item) {
    res.status(404).json({ error: "Oefening niet gevonden." });
    return;
  }
  const neighbor = await prisma.programItem.findFirst({
    where: {
      dayId: item.dayId,
      volgorde: parsed.data.direction === -1 ? { lt: item.volgorde } : { gt: item.volgorde },
    },
    orderBy: { volgorde: parsed.data.direction === -1 ? "desc" : "asc" },
  });
  if (!neighbor) {
    res.json({ ok: true });
    return;
  }
  await prisma.$transaction([
    prisma.programItem.update({ where: { id: item.id }, data: { volgorde: neighbor.volgorde } }),
    prisma.programItem.update({ where: { id: neighbor.id }, data: { volgorde: item.volgorde } }),
  ]);
  res.json({ ok: true });
});

const copyInput = z.object({ targetClientId: z.string().min(1) });

router.post("/days/:dayId/copy-to-client", async (req, res) => {
  const parsed = copyInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Kies een klant om naar te kopiëren." });
    return;
  }
  const source = await prisma.programDay.findUnique({
    where: { id: req.params.dayId },
    include: { items: { orderBy: { volgorde: "asc" } } },
  });
  if (!source) {
    res.status(404).json({ error: "Trainingsdag niet gevonden." });
    return;
  }
  const targetClient = await prisma.client.findUnique({ where: { id: parsed.data.targetClientId } });
  const sourceClient = await prisma.client.findUnique({ where: { id: source.clientId } });
  if (!targetClient) {
    res.status(404).json({ error: "Klant niet gevonden." });
    return;
  }

  const max = await prisma.programDay.aggregate({ where: { clientId: targetClient.id }, _max: { volgorde: true } });
  const volgorde = (max._max.volgorde || 0) + 1;
  const titel = sourceClient ? `${source.titel} · van ${sourceClient.naam.split(" ")[0]}` : source.titel;

  const day = await prisma.programDay.create({
    data: {
      clientId: targetClient.id,
      volgorde,
      titel,
      rotate: source.rotate,
      rowing: source.rowing,
      rowBase: source.rowBase,
      rowPct: source.rowPct,
      rowWeek: source.rowWeek,
      items: {
        create: source.items.map((item, i) => ({
          volgorde: i + 1,
          naam: item.naam,
          block: item.block,
          type: item.type,
          unit: item.unit,
          sets: item.sets,
          repsOfSec: item.repsOfSec,
          doelgewicht: item.doelgewicht,
          restSec: item.restSec,
          videoUrl: item.videoUrl,
          notitie: item.notitie,
          bron: item.bron,
        })),
      },
    },
    include: { items: { orderBy: { volgorde: "asc" } } },
  });
  res.status(201).json(day);
});

export default router;
