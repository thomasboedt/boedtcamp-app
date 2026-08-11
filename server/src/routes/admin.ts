import { Router } from "express";
import { prisma } from "../db";
import { seedLibrary, seedTrainer } from "../seedData";

const router = Router();

// One-time production bootstrap: creates the trainer account + exercise library.
// There is no self-serve sign-up (this is a single-trainer app), and Netlify DB's
// schema migrations only cover DDL, not this seed data — so this endpoint is the
// bridge to get a freshly-provisioned production database usable. Gated by a
// secret so it can't be triggered by anyone else; safe to call more than once
// (everything it does is an upsert).
router.get("/seed", async (req, res) => {
  const expected = process.env.SEED_SECRET;
  if (!expected || req.query.secret !== expected) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const username = process.env.TRAINER_USERNAME || "tom";
  const password = process.env.TRAINER_PASSWORD || "boedtcamp";
  await seedTrainer(prisma, username, password);
  await seedLibrary(prisma);
  res.json({ ok: true, trainerUsername: username });
});

export default router;
