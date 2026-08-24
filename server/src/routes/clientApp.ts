import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireClient } from "../middleware/auth";
import { CORE_POOL, MOB_POOL, fmtNumber, isoWeek, pickPool, rowMinutes } from "../lib/schedule";
import { searchFood, lookupBarcode } from "../lib/openFoodFacts";
import { analyzeFoodPhoto } from "../lib/foodPhotoAI";

const router = Router();
router.use(requireClient);

router.get("/days", async (req, res) => {
  const days = await prisma.programDay.findMany({
    where: { clientId: req.clientId },
    orderBy: { volgorde: "asc" },
  });
  res.json(days.map((d) => ({ id: d.id, volgorde: d.volgorde, titel: d.titel, rotate: d.rotate, rowing: d.rowing })));
});

type ComputedExercise = {
  key: string;
  programItemId: string | null;
  naam: string;
  block: "warmup" | "main" | "cooldown";
  type: "reps" | "time";
  unit: string;
  sets: number;
  target: number;
  doelgewicht: number;
  restSec: number;
  videoUrl: string | null;
  notitie: string | null;
  pool: boolean;
};

async function computeDayExercises(dayId: string): Promise<{ day: Awaited<ReturnType<typeof prisma.programDay.findUniqueOrThrow>>; exercises: ComputedExercise[] }> {
  const day = await prisma.programDay.findUniqueOrThrow({ where: { id: dayId }, include: { items: { orderBy: { volgorde: "asc" } } } });

  const own: ComputedExercise[] = day.items.map((it) => ({
    key: it.id,
    programItemId: it.id,
    naam: it.naam,
    block: it.block as ComputedExercise["block"],
    type: it.type as ComputedExercise["type"],
    unit: it.unit || (it.type === "time" && !it.doelgewicht ? "sec" : "kg"),
    sets: it.sets,
    target: it.repsOfSec,
    doelgewicht: it.doelgewicht,
    restSec: it.restSec,
    videoUrl: it.videoUrl,
    notitie: it.notitie,
    pool: false,
  }));

  const pooled: ComputedExercise[] = [];
  if (day.rotate) {
    const offset = isoWeek() + day.poolShift + day.volgorde * 4;
    pickPool(MOB_POOL, 3, offset + 1).forEach((e) =>
      pooled.push({
        key: e.id,
        programItemId: null,
        naam: e.naam,
        block: "warmup",
        type: e.type as "reps" | "time",
        unit: "sec",
        sets: 2,
        target: e.repsOfSec,
        doelgewicht: 0,
        restSec: 20,
        videoUrl: null,
        notitie: null,
        pool: true,
      })
    );
    pickPool(CORE_POOL, 3, offset).forEach((e) =>
      pooled.push({
        key: e.id,
        programItemId: null,
        naam: e.naam,
        block: "cooldown",
        type: e.type as "reps" | "time",
        unit: e.type === "time" ? "sec" : "kg",
        sets: 3,
        target: e.repsOfSec,
        doelgewicht: e.doelgewicht || 0,
        restSec: 30,
        videoUrl: null,
        notitie: null,
        pool: true,
      })
    );
  }

  const all = own.concat(pooled);
  if (day.rowing) {
    const min = rowMinutes(day.rowBase, day.rowPct, day.rowWeek);
    all.push({
      key: "rowing",
      programItemId: null,
      naam: "Roeien · continu tempo",
      block: "main",
      type: "time",
      unit: "min",
      sets: 1,
      target: min,
      doelgewicht: 0,
      restSec: 0,
      videoUrl: null,
      notitie: `Week ${day.rowWeek + 1} van de opbouw: ${fmtNumber(min)} min aan een tempo dat je kan volhouden (praten mag nog net).`,
      pool: false,
    });
  }
  const order = { warmup: 0, main: 1, cooldown: 2 };
  all.sort((a, b) => order[a.block] - order[b.block]);
  return { day, exercises: all };
}

router.get("/days/:dayId/exercises", async (req, res) => {
  const { day, exercises } = await computeDayExercises(req.params.dayId);
  if (day.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }

  const openSession = await prisma.session.findFirst({
    where: { clientId: req.clientId, dayId: day.id, afgerondOp: null },
    orderBy: { gestartOp: "desc" },
    include: { setLogs: true },
  });

  const withHistory = await Promise.all(
    exercises.map(async (ex) => {
      const sets = await Promise.all(
        Array.from({ length: ex.sets }).map(async (_, i) => {
          const setNr = i + 1;
          const prevLog = await prisma.setLog.findFirst({
            where: {
              oefeningNaam: ex.naam,
              setNr,
              session: { clientId: req.clientId, afgerondOp: { not: null } },
              ...(openSession ? { sessionId: { not: openSession.id } } : {}),
            },
            orderBy: { loggedAt: "desc" },
          });
          const current = openSession?.setLogs.find((l) => l.oefeningNaam === ex.naam && l.setNr === setNr);
          const defaultVal = ex.type === "time" && !ex.doelgewicht ? ex.target : ex.doelgewicht;
          return {
            setNr,
            reps: current?.reps ?? ex.target,
            value: current ? (ex.unit === "kg" ? current.gewichtKg : current.seconden) ?? defaultVal : defaultVal,
            afgevinkt: current?.afgevinkt || false,
            prevLabel: prevLog
              ? `vorige: ${fmtNumber((ex.unit === "kg" ? prevLog.gewichtKg : prevLog.seconden) || 0)} ${ex.unit}`
              : "vorige: —",
          };
        })
      );
      return { ...ex, sessionId: openSession?.id || null, sets };
    })
  );

  res.json({ day: { id: day.id, titel: day.titel, volgorde: day.volgorde }, exercises: withHistory });
});

router.post("/sessions", async (req, res) => {
  const schema = z.object({ dayId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "dayId vereist." });
    return;
  }
  const day = await prisma.programDay.findUnique({ where: { id: parsed.data.dayId } });
  if (!day || day.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  const existing = await prisma.session.findFirst({
    where: { clientId: req.clientId, dayId: day.id, afgerondOp: null },
    orderBy: { gestartOp: "desc" },
  });
  if (existing) {
    res.json(existing);
    return;
  }
  const session = await prisma.session.create({
    data: { clientId: req.clientId!, dayId: day.id, weekNr: isoWeek() },
  });
  res.status(201).json(session);
});

const setLogInput = z.object({
  programItemId: z.string().nullable().optional(),
  oefeningNaam: z.string().min(1),
  setNr: z.number().int().positive(),
  reps: z.number().nullable().optional(),
  gewichtKg: z.number().nullable().optional(),
  seconden: z.number().nullable().optional(),
  unit: z.string(),
  afgevinkt: z.boolean().optional(),
});

router.put("/sessions/:sessionId/sets", async (req, res) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.sessionId } });
  if (!session || session.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  const parsed = setLogInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige set-data." });
    return;
  }
  const data = parsed.data;
  const log = await prisma.setLog.upsert({
    where: { sessionId_oefeningNaam_setNr: { sessionId: session.id, oefeningNaam: data.oefeningNaam, setNr: data.setNr } },
    create: { sessionId: session.id, ...data },
    update: data,
  });
  res.json(log);
});

router.delete("/sessions/:sessionId/sets/:oefeningNaam/:setNr", async (req, res) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.sessionId } });
  if (!session || session.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  await prisma.setLog
    .delete({
      where: {
        sessionId_oefeningNaam_setNr: {
          sessionId: session.id,
          oefeningNaam: decodeURIComponent(req.params.oefeningNaam),
          setNr: Number(req.params.setNr),
        },
      },
    })
    .catch(() => null);
  res.json({ ok: true });
});

router.post("/sessions/:sessionId/complete", async (req, res) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.sessionId }, include: { setLogs: true } });
  if (!session || session.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  const schema = z.object({
    rpe: z.number().int().min(0).max(4).nullable().optional(),
    opmerking: z.string().nullable().optional(),
    pijn: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer." });
    return;
  }
  const updated = await prisma.session.update({
    where: { id: session.id },
    data: { ...parsed.data, afgerondOp: new Date() },
    include: { setLogs: true },
  });
  const volume = updated.setLogs.reduce((a, l) => a + (l.unit === "kg" && l.gewichtKg ? l.gewichtKg * (l.reps || 0) : 0), 0);
  res.json({
    doneSets: updated.setLogs.filter((l) => l.afgevinkt).length,
    doneVolume: fmtNumber(volume),
    donePRs: 0,
  });
});

router.get("/history", async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { clientId: req.clientId, afgerondOp: { not: null } },
    orderBy: { afgerondOp: "desc" },
    take: 8,
    include: { day: true, setLogs: true },
  });
  res.json(
    sessions.map((s) => {
      const volume = s.setLogs.reduce((a, l) => a + (l.unit === "kg" && l.gewichtKg ? l.gewichtKg * (l.reps || 0) : 0), 0);
      return {
        id: s.id,
        title: s.day.titel,
        when: s.afgerondOp ? new Date(s.afgerondOp).toLocaleDateString("nl-BE", { weekday: "short" }) : "",
        sub: `${new Set(s.setLogs.map((l) => l.oefeningNaam)).size} oefeningen · ${fmtNumber(volume / 1000)} ton volume`,
      };
    })
  );
});

router.get("/food", async (req, res) => {
  const datum = (req.query.datum as string) || new Date().toISOString().slice(0, 10);
  const client = await prisma.client.findUnique({ where: { id: req.clientId } });
  const entries = await prisma.foodEntry.findMany({
    where: { clientId: req.clientId, datum },
    orderBy: { loggedAt: "asc" },
  });
  res.json({
    datum,
    entries,
    doelen: {
      calorieDoel: client?.calorieDoel ?? null,
      eiwitDoel: client?.eiwitDoel ?? null,
      koolhydratenDoel: client?.koolhydratenDoel ?? null,
      vetDoel: client?.vetDoel ?? null,
    },
  });
});

const foodEntryInput = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum."),
  naam: z.string().min(1),
  merk: z.string().optional().nullable(),
  hoeveelheid: z.number().positive(),
  eenheid: z.string().min(1),
  kcal: z.number().min(0),
  eiwit: z.number().min(0).default(0),
  koolhydraten: z.number().min(0).default(0),
  vet: z.number().min(0).default(0),
  bron: z.enum(["handmatig", "zoeken", "barcode", "foto"]),
  bronRef: z.string().optional().nullable(),
});

router.post("/food", async (req, res) => {
  const parsed = foodEntryInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Ongeldige invoer." });
    return;
  }
  const entry = await prisma.foodEntry.create({ data: { ...parsed.data, clientId: req.clientId! } });
  res.status(201).json(entry);
});

router.delete("/food/:id", async (req, res) => {
  const entry = await prisma.foodEntry.findUnique({ where: { id: req.params.id } });
  if (!entry || entry.clientId !== req.clientId) {
    res.status(403).json({ error: "Geen toegang." });
    return;
  }
  await prisma.foodEntry.delete({ where: { id: entry.id } });
  res.json({ ok: true });
});

router.get("/food/search", async (req, res) => {
  const q = ((req.query.q as string) || "").trim();
  if (q.length < 2) {
    res.json({ items: [] });
    return;
  }
  try {
    res.json({ items: await searchFood(q) });
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : "Zoeken mislukt." });
  }
});

router.get("/food/barcode/:code", async (req, res) => {
  try {
    const product = await lookupBarcode(req.params.code);
    if (!product) {
      res.status(404).json({ error: "Product niet gevonden." });
      return;
    }
    res.json(product);
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : "Opzoeken mislukt." });
  }
});

const photoInput = z.object({
  image: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
});

router.post("/food/photo", async (req, res) => {
  const parsed = photoInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige foto." });
    return;
  }
  try {
    res.json(await analyzeFoodPhoto(parsed.data.image, parsed.data.mimeType));
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : "Foto-herkenning mislukt." });
  }
});

export default router;
