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
  // Netlify Database's own migration step has proven unreliable (see the
  // nutrition_tracking migration) — apply schema changes here too, guarded
  // so this stays safe to run against a database that's already up to date.
  // One statement per call: $executeRawUnsafe goes through a parameterized
  // driver call that doesn't support multiple ;-separated commands.
  const schemaStatements = [
    `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "calorieDoel" INTEGER`,
    `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "eiwitDoel" INTEGER`,
    `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "koolhydratenDoel" INTEGER`,
    `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "vetDoel" INTEGER`,
    `CREATE TABLE IF NOT EXISTS "FoodEntry" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "datum" TEXT NOT NULL,
        "naam" TEXT NOT NULL,
        "merk" TEXT,
        "hoeveelheid" DOUBLE PRECISION NOT NULL DEFAULT 100,
        "eenheid" TEXT NOT NULL DEFAULT 'g',
        "kcal" DOUBLE PRECISION NOT NULL,
        "eiwit" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "koolhydraten" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "vet" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "bron" TEXT NOT NULL,
        "bronRef" TEXT,
        "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "FoodEntry_clientId_datum_idx" ON "FoodEntry"("clientId", "datum")`,
    `DO $$ BEGIN
      ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  ];
  for (const statement of schemaStatements) {
    await prisma.$executeRawUnsafe(statement);
  }

  const username = process.env.TRAINER_USERNAME || "tom";
  const password = process.env.TRAINER_PASSWORD || "boedtcamp";
  await seedTrainer(prisma, username, password);
  await seedLibrary(prisma);
  res.json({ ok: true, trainerUsername: username });
});

export default router;
