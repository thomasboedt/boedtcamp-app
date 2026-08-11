import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import {
  CLIENT_COOKIE,
  TRAINER_COOKIE,
  clientCookieOptions,
  comparePin,
  isValidPin,
  pinLookupHash,
  signClientToken,
  signTrainerToken,
  trainerCookieOptions,
} from "../auth";
import { requireClient, requireTrainer } from "../middleware/auth";

const router = Router();

const TRAINER_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const CLIENT_TOKEN_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

router.post("/trainer/login", async (req, res) => {
  const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Gebruikersnaam en wachtwoord vereist." });
    return;
  }
  const { username, password } = parsed.data;
  const trainer = await prisma.trainer.findUnique({ where: { username } });
  if (!trainer || !(await bcrypt.compare(password, trainer.passwordHash))) {
    res.status(401).json({ error: "Ongeldige gebruikersnaam of wachtwoord." });
    return;
  }
  const token = signTrainerToken(trainer.id);
  res.cookie(TRAINER_COOKIE, token, trainerCookieOptions(TRAINER_TOKEN_MAX_AGE));
  res.json({ ok: true, username: trainer.username });
});

router.post("/trainer/logout", (req, res) => {
  res.clearCookie(TRAINER_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/trainer/me", requireTrainer, async (req, res) => {
  const trainer = await prisma.trainer.findUnique({ where: { id: req.trainerId } });
  if (!trainer) {
    res.status(401).json({ error: "Niet ingelogd." });
    return;
  }
  res.json({ id: trainer.id, username: trainer.username });
});

router.post("/client/login", async (req, res) => {
  const schema = z.object({ pin: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !isValidPin(parsed.data.pin)) {
    res.status(400).json({ error: "Voer een geldige 6-cijferige pincode in." });
    return;
  }
  const { pin } = parsed.data;
  const client = await prisma.client.findUnique({ where: { pinLookup: pinLookupHash(pin) } });
  if (!client || !(await comparePin(pin, client.pinHash))) {
    res.status(401).json({ error: "Onbekende pincode." });
    return;
  }
  const token = signClientToken(client.id);
  res.cookie(CLIENT_COOKIE, token, clientCookieOptions(CLIENT_TOKEN_MAX_AGE));
  res.json({ ok: true, clientId: client.id, naam: client.naam });
});

router.post("/client/logout", (req, res) => {
  res.clearCookie(CLIENT_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/client/me", requireClient, async (req, res) => {
  const client = await prisma.client.findUnique({ where: { id: req.clientId } });
  if (!client) {
    res.status(401).json({ error: "Niet ingelogd." });
    return;
  }
  res.json({
    id: client.id,
    naam: client.naam,
    meta: client.meta,
    focus: client.focus,
    freq: client.freq,
  });
});

export default router;
