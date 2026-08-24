-- CreateTable
CREATE TABLE "NutritionTarget" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL DEFAULT 2000,
    "carbs" INTEGER NOT NULL DEFAULT 220,
    "protein" INTEGER NOT NULL DEFAULT 120,
    "fat" INTEGER NOT NULL DEFAULT 70,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
);

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTarget_clientId_key" ON "NutritionTarget"("clientId");

-- CreateIndex
CREATE INDEX "FoodEntry_clientId_dateIso_idx" ON "FoodEntry"("clientId", "dateIso");

-- AddForeignKey
ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
