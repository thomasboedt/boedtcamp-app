-- CreateTable
CREATE TABLE "Measurement" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Measurement_clientId_dateIso_idx" ON "Measurement"("clientId", "dateIso");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_clientId_dateIso_key" ON "Measurement"("clientId", "dateIso");

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
