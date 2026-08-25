-- NutritionTarget: switch macros from absolute grams to a % split of kcal,
-- and add persisted BMR/TDEE calculator inputs.
-- Existing carbs/protein/fat grams are converted to their equivalent
-- percentage of kcal (carbs/protein at 4 kcal/g, fat at 9 kcal/g) before the
-- old columns are dropped, so a trainer's existing targets keep the same
-- nutritional intent instead of being reset.

-- AlterTable
ALTER TABLE "NutritionTarget"
  ADD COLUMN "pctCarbs" INTEGER,
  ADD COLUMN "pctProtein" INTEGER,
  ADD COLUMN "pctFat" INTEGER,
  ADD COLUMN "calcSex" TEXT,
  ADD COLUMN "calcAge" INTEGER,
  ADD COLUMN "calcWeight" DOUBLE PRECISION,
  ADD COLUMN "calcHeight" DOUBLE PRECISION,
  ADD COLUMN "calcActivity" TEXT,
  ADD COLUMN "calcGoal" TEXT,
  ADD COLUMN "calcFormula" TEXT;

UPDATE "NutritionTarget"
SET
  "pctCarbs" = ROUND(("carbs" * 4 * 100.0) / NULLIF("kcal", 0)),
  "pctProtein" = ROUND(("protein" * 4 * 100.0) / NULLIF("kcal", 0)),
  "pctFat" = ROUND(("fat" * 9 * 100.0) / NULLIF("kcal", 0));

-- Fallback for the edge case of kcal = 0 (division above yields NULL).
UPDATE "NutritionTarget" SET "pctCarbs" = 45 WHERE "pctCarbs" IS NULL;
UPDATE "NutritionTarget" SET "pctProtein" = 25 WHERE "pctProtein" IS NULL;
UPDATE "NutritionTarget" SET "pctFat" = 30 WHERE "pctFat" IS NULL;

ALTER TABLE "NutritionTarget"
  ALTER COLUMN "pctCarbs" SET NOT NULL,
  ALTER COLUMN "pctCarbs" SET DEFAULT 45,
  ALTER COLUMN "pctProtein" SET NOT NULL,
  ALTER COLUMN "pctProtein" SET DEFAULT 25,
  ALTER COLUMN "pctFat" SET NOT NULL,
  ALTER COLUMN "pctFat" SET DEFAULT 30;

ALTER TABLE "NutritionTarget"
  DROP COLUMN "carbs",
  DROP COLUMN "protein",
  DROP COLUMN "fat";

-- FoodEntry: portion (unit) x count, purely for display — grams stays the
-- source of truth for all totals/history. Existing rows become "1 portion of
-- unit = grams" so nothing changes about how they render (count=1 entries
-- always just show the grams value, never the unit).
ALTER TABLE "FoodEntry"
  ADD COLUMN "unit" DOUBLE PRECISION,
  ADD COLUMN "count" INTEGER;

UPDATE "FoodEntry" SET "unit" = "grams", "count" = 1;

ALTER TABLE "FoodEntry"
  ALTER COLUMN "unit" SET NOT NULL,
  ALTER COLUMN "unit" SET DEFAULT 1,
  ALTER COLUMN "count" SET NOT NULL,
  ALTER COLUMN "count" SET DEFAULT 1;
