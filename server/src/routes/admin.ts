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

// Diagnostic: lists every table in the public schema, and every column (with
// type) for NutritionTarget/FoodEntry specifically if they exist. Read-only —
// exists purely to see actual production schema state from outside, since
// there's no direct DB connection available for introspection otherwise.
router.get("/db-info", async (req, res) => {
  const expected = process.env.SEED_SECRET;
  if (!expected || req.query.secret !== expected) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name::text FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  const nutritionTargetColumns = await prisma.$queryRawUnsafe(
    `SELECT column_name::text, data_type::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'NutritionTarget' ORDER BY ordinal_position`
  );
  const foodEntryColumns = await prisma.$queryRawUnsafe(
    `SELECT column_name::text, data_type::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'FoodEntry' ORDER BY ordinal_position`
  );
  res.json({ tables, nutritionTargetColumns, foodEntryColumns });
});

// One-time production bootstrap for the 20260824130648_add_nutrition migration.
// There's no externally-reachable DATABASE_URL for this Netlify DB (Neon) instance
// to run `prisma migrate deploy` against from outside a deployed function, so this
// applies the same DDL from inside one, where the connection already works.
//
// Every statement is safe to run more than once, including against a table that
// already exists but is missing some of these columns (CREATE TABLE IF NOT EXISTS
// alone would silently skip a pre-existing-but-incomplete table, so every column
// also gets an explicit ADD COLUMN IF NOT EXISTS as a repair pass). Also records
// the migration in `_prisma_migrations` (using the checksum Prisma itself computed
// for this exact migration.sql locally) so a future `prisma migrate deploy` against
// a real DATABASE_URL, if one becomes available, sees it as already applied instead
// of re-running or conflicting with it.
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
        CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "clientId" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "kcal" INTEGER NOT NULL DEFAULT 2000`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "carbs" INTEGER NOT NULL DEFAULT 220`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "protein" INTEGER NOT NULL DEFAULT 120`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "fat" INTEGER NOT NULL DEFAULT 70`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`);
    // Rows left over from an earlier partial run (e.g. an "id"-only row from
    // before this column existed) can't satisfy NOT NULL — the feature has
    // never worked end to end yet, so nothing here is real user data to lose.
    await prisma.$executeRawUnsafe(`DELETE FROM "NutritionTarget" WHERE "clientId" IS NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "clientId" SET NOT NULL`);

    // FoodEntry, unlike NutritionTarget, turned out to already exist in
    // production under this exact name with an entirely different, unrelated
    // set of Dutch-named columns (datum, hoeveelheid, eenheid, eiwit,
    // koolhydraten, vet, bronRef, loggedAt — nothing in this codebase writes
    // those). ADD COLUMN IF NOT EXISTS is a no-op for any name that happened
    // to already exist (kcal, naam, merk, bron all collided this way), which
    // silently inherited the old, wrong type for "kcal" (double precision
    // instead of the Int this app expects). Patching around that piecemeal
    // is too fragile — drop and recreate clean. Confirmed nothing in the
    // deployed app has ever successfully written a row here, so there's no
    // real data under either schema to lose.
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "FoodEntry" CASCADE`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "FoodEntry" (
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

// One-time production bootstrap for the 20260825085232_nutrition_targets_v2
// migration: NutritionTarget moves from absolute-gram macros to a % split of
// kcal (+ persisted BMR calculator inputs), and FoodEntry gains unit/count
// for the portion×count entry UI. Existing carbs/protein/fat grams are
// converted to their equivalent % of kcal before the old columns are
// dropped, preserving whatever a trainer already configured.
//
// Written to tolerate being called more than once, INCLUDING after the old
// carbs/protein/fat columns are already gone (the backfill only runs while
// they still exist) — the previous migration endpoint here taught the hard
// way that "safe to re-run" has to mean "safe after partial success", not
// just "safe from a clean slate".
router.get("/migrate-nutrition-targets-v2", async (req, res) => {
  const expected = process.env.SEED_SECRET;
  if (!expected || req.query.secret !== expected) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "pctCarbs" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "pctProtein" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "pctFat" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcSex" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcAge" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcWeight" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcHeight" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcActivity" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcGoal" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ADD COLUMN IF NOT EXISTS "calcFormula" TEXT`);

    // Only touches carbs/protein/fat while they still exist, so a second
    // call (after the DROP COLUMN below already ran once) is a no-op here
    // instead of an error.
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'NutritionTarget' AND column_name = 'carbs') THEN
          UPDATE "NutritionTarget" SET
            "pctCarbs" = COALESCE("pctCarbs", ROUND(("carbs" * 4 * 100.0) / NULLIF("kcal", 0))::int),
            "pctProtein" = COALESCE("pctProtein", ROUND(("protein" * 4 * 100.0) / NULLIF("kcal", 0))::int),
            "pctFat" = COALESCE("pctFat", ROUND(("fat" * 9 * 100.0) / NULLIF("kcal", 0))::int);
        END IF;
      END $$
    `);
    await prisma.$executeRawUnsafe(`UPDATE "NutritionTarget" SET "pctCarbs" = 45 WHERE "pctCarbs" IS NULL`);
    await prisma.$executeRawUnsafe(`UPDATE "NutritionTarget" SET "pctProtein" = 25 WHERE "pctProtein" IS NULL`);
    await prisma.$executeRawUnsafe(`UPDATE "NutritionTarget" SET "pctFat" = 30 WHERE "pctFat" IS NULL`);

    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "pctCarbs" SET NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "pctCarbs" SET DEFAULT 45`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "pctProtein" SET NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "pctProtein" SET DEFAULT 25`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "pctFat" SET NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" ALTER COLUMN "pctFat" SET DEFAULT 30`);

    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" DROP COLUMN IF EXISTS "carbs"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" DROP COLUMN IF EXISTS "protein"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "NutritionTarget" DROP COLUMN IF EXISTS "fat"`);

    await prisma.$executeRawUnsafe(`ALTER TABLE "FoodEntry" ADD COLUMN IF NOT EXISTS "unit" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FoodEntry" ADD COLUMN IF NOT EXISTS "count" INTEGER`);
    await prisma.$executeRawUnsafe(`UPDATE "FoodEntry" SET "unit" = "grams" WHERE "unit" IS NULL`);
    await prisma.$executeRawUnsafe(`UPDATE "FoodEntry" SET "count" = 1 WHERE "count" IS NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FoodEntry" ALTER COLUMN "unit" SET NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FoodEntry" ALTER COLUMN "unit" SET DEFAULT 1`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FoodEntry" ALTER COLUMN "count" SET NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FoodEntry" ALTER COLUMN "count" SET DEFAULT 1`);

    let recorded = false;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
         SELECT gen_random_uuid()::text, $1, $2, now(), now(), 1
         WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $3)`,
        "5615d5bd0ca7e97636906156d15e8434d6b745452dfccc9b9b85617e97cb9b88",
        "20260825085232_nutrition_targets_v2",
        "20260825085232_nutrition_targets_v2"
      );
      recorded = true;
    } catch {
      // _prisma_migrations missing or unreachable — the columns above are still applied either way.
    }

    res.json({ ok: true, recordedInMigrationsTable: recorded });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// One-time production bootstrap for the 20260901133700_add_measurements
// migration: a brand-new table, so — unlike the two migrations above — this
// is pure additive DDL with no data conversion or risk of colliding with a
// pre-existing column of the wrong type.
router.get("/migrate-measurements", async (req, res) => {
  const expected = process.env.SEED_SECRET;
  if (!expected || req.query.secret !== expected) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Measurement" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "dateIso" TEXT NOT NULL,
        "weight" DOUBLE PRECISION,
        "height" DOUBLE PRECISION,
        "fat" DOUBLE PRECISION,
        "muscle" DOUBLE PRECISION,
        "water" DOUBLE PRECISION,
        "visceral" INTEGER,
        "waist" DOUBLE PRECISION,
        "hip" DOUBLE PRECISION,
        "stress" INTEGER,
        "sleep" INTEGER,
        "energy" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Measurement_clientId_dateIso_idx" ON "Measurement"("clientId", "dateIso")`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Measurement_clientId_dateIso_key" ON "Measurement"("clientId", "dateIso")`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_clientId_fkey"
          FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    let recorded = false;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
         SELECT gen_random_uuid()::text, $1, $2, now(), now(), 1
         WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $3)`,
        "3c7cd175b35b3a601c99d1efb3fba866f638fd24b23916d67c6fd8f587e99835",
        "20260901133700_add_measurements",
        "20260901133700_add_measurements"
      );
      recorded = true;
    } catch {
      // _prisma_migrations missing or unreachable — the table above is still created either way.
    }

    res.json({ ok: true, recordedInMigrationsTable: recorded });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
