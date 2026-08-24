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

// One-time production bootstrap for the 20260824130648_add_nutrition migration.
// There's no externally-reachable DATABASE_URL for this Netlify DB (Neon) instance
// to run `prisma migrate deploy` against from outside a deployed function, so this
// applies the same DDL from inside one, where the connection already works. Every
// statement is written to be safe to run more than once. Also records the migration
// in `_prisma_migrations` (using the checksum Prisma itself computed for this exact
// migration.sql locally) so a future `prisma migrate deploy` against a real
// DATABASE_URL — if one becomes available — sees it as already applied instead of
// re-running or conflicting with it.
router.get("/migrate-nutrition", async (req, res) => {
  const expected = process.env.SEED_SECRET;
  if (!expected || req.query.secret !== expected) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NutritionTarget" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "kcal" INTEGER NOT NULL DEFAULT 2000,
        "carbs" INTEGER NOT NULL DEFAULT 220,
        "protein" INTEGER NOT NULL DEFAULT 120,
        "fat" INTEGER NOT NULL DEFAULT 70,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FoodEntry" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "dateIso" TEXT NOT NULL,
        "meal" TEXT NOT NULL,
        "naam" TEXT NOT NULL,
        "merk" TEXT,
        "barcode" TEXT,
        "grams" DOUBLE PRECISION NOT NULL,
        "kcal" INTEGER NOT NULL,
        "carbs" DOUBLE PRECISION NOT NULL,
        "protein" DOUBLE PRECISION NOT NULL,
        "fat" DOUBLE PRECISION NOT NULL,
        "bron" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "NutritionTarget_clientId_key" ON "NutritionTarget"("clientId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "FoodEntry_clientId_dateIso_idx" ON "FoodEntry"("clientId", "dateIso")`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_clientId_fkey"
          FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_clientId_fkey"
          FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    let recorded = false;
    try {
      // migration_name has no unique constraint in Prisma's own table, so guard
      // idempotency with an explicit existence check rather than ON CONFLICT.
      // The migration_name value is passed twice (as $2 and $3, not reused) —
      // reusing one placeholder across the differently-typed SELECT-list and
      // WHERE-clause positions makes Postgres's prepared-statement planner
      // reject the query with "inconsistent types deduced for parameter".
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
         SELECT gen_random_uuid()::text, $1, $2, now(), now(), 1
         WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $3)`,
        "afd974a9af6a17b3c660928800b7298afd3df539012fd95b711e8b27ccefc6f0",
        "20260824130648_add_nutrition",
        "20260824130648_add_nutrition"
      );
      recorded = true;
    } catch {
      // _prisma_migrations missing or unreachable — the tables above are still created either way.
    }

    res.json({ ok: true, recordedInMigrationsTable: recorded });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
