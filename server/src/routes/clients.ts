import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { hashPin, isValidPin, pinLookupHash } from "../auth";
import { requireTrainer } from "../middleware/auth";

const router = Router();
router.use(requireTrainer);

router.get("/clients", async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
    include: { days: { select: { id: true } } },
  });
  res.json(
    clients.map((c) => ({
      id: c.id,
      naam: c.naam,
      meta: c.meta,
      focus: c.focus,
      freq: c.freq,
      geboortejaar: c.geboortejaar,
      days: c.days.length,
      calorieDoel: c.calorieDoel,
      eiwitDoel: c.eiwitDoel,
      koolhydratenDoel: c.koolhydratenDoel,
      vetDoel: c.vetDoel,
    }))
  );
});

const clientInput = z.object({
  naam: z.string().min(1),
  meta: z.string().optional().nullable(),
  focus: z.string().optional().nullable(),
  freq: z.string().optional().nullable(),
  geboortejaar: z.number().int().optional().nullable(),
  pin: z.string().refine(isValidPin, "Pincode moet uit 6 cijfers bestaan."),
});

router.post("/clients", async (req, res) => {
  const parsed = clientInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Ongeldige invoer." });
    return;
  }
  const { pin, ...rest } = parsed.data;
  const pinLookup = pinLookupHash(pin);
  if (await prisma.client.findUnique({ where: { pinLookup } })) {
    res.status(409).json({ error: "Deze pincode is al in gebruik door een andere klant." });
    return;
  }
  const client = await prisma.client.create({
    data: { ...rest, pinHash: await hashPin(pin), pinLookup },
  });
  res.status(201).json({ id: client.id });
});

const clientUpdateInput = z.object({
  naam: z.string().min(1).optional(),
  meta: z.string().optional().nullable(),
  focus: z.string().optional().nullable(),
  freq: z.string().optional().nullable(),
  geboortejaar: z.number().int().optional().nullable(),
  calorieDoel: z.number().int().min(0).optional().nullable(),
  eiwitDoel: z.number().int().min(0).optional().nullable(),
  koolhydratenDoel: z.number().int().min(0).optional().nullable(),
  vetDoel: z.number().int().min(0).optional().nullable(),
});

router.patch("/clients/:id", async (req, res) => {
  const parsed = clientUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer." });
    return;
  }
  await prisma.client.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ ok: true });
});

// Trainer sets/changes a client's pincode. Chosen by the trainer, not generated,
// per the requirement: "een unieke pincode ... die ik kan instellen als trainer".
router.post("/clients/:id/pin", async (req, res) => {
  const schema = z.object({ pin: z.string().refine(isValidPin, "Pincode moet uit 6 cijfers bestaan.") });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Ongeldige pincode." });
    return;
  }
  const { pin } = parsed.data;
  const pinLookup = pinLookupHash(pin);
  const existing = await prisma.client.findUnique({ where: { pinLookup } });
  if (existing && existing.id !== req.params.id) {
    res.status(409).json({ error: "Deze pincode is al in gebruik door een andere klant." });
    return;
  }
  await prisma.client.update({
    where: { id: req.params.id },
    data: { pinHash: await hashPin(pin), pinLookup },
  });
  res.json({ ok: true });
});

router.delete("/clients/:id", async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
