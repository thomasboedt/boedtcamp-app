-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "calorieDoel" INTEGER,
ADD COLUMN     "eiwitDoel" INTEGER,
ADD COLUMN     "koolhydratenDoel" INTEGER,
ADD COLUMN     "vetDoel" INTEGER;

-- CreateTable
CREATE TABLE "FoodEntry" (
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
);

-- CreateIndex
CREATE INDEX "FoodEntry_clientId_datum_idx" ON "FoodEntry"("clientId", "datum");

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
