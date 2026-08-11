-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "geboortejaar" INTEGER,
    "meta" TEXT,
    "focus" TEXT,
    "freq" TEXT,
    "pinHash" TEXT NOT NULL,
    "pinLookup" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "volgorde" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "rotate" BOOLEAN NOT NULL DEFAULT false,
    "rowing" BOOLEAN NOT NULL DEFAULT false,
    "rowBase" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "rowPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "rowWeek" INTEGER NOT NULL DEFAULT 0,
    "poolShift" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramItem" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "volgorde" INTEGER NOT NULL,
    "naam" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reps',
    "unit" TEXT,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "repsOfSec" INTEGER NOT NULL DEFAULT 10,
    "doelgewicht" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "restSec" INTEGER NOT NULL DEFAULT 90,
    "videoUrl" TEXT,
    "notitie" TEXT,
    "bron" TEXT NOT NULL DEFAULT 'eigen',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "weekNr" INTEGER NOT NULL DEFAULT 1,
    "gestartOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "afgerondOp" TIMESTAMP(3),
    "rpe" INTEGER,
    "opmerking" TEXT,
    "pijn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "programItemId" TEXT,
    "oefeningNaam" TEXT NOT NULL,
    "setNr" INTEGER NOT NULL,
    "reps" INTEGER,
    "gewichtKg" DOUBLE PRECISION,
    "seconden" INTEGER,
    "unit" TEXT NOT NULL,
    "afgevinkt" BOOLEAN NOT NULL DEFAULT false,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryExercise" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "primaireSpier" TEXT NOT NULL,
    "materiaal" TEXT,
    "categorie" TEXT,
    "doel" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reps',
    "afbeelding" TEXT,
    "bron" TEXT NOT NULL,
    "bronId" TEXT NOT NULL,

    CONSTRAINT "LibraryExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_username_key" ON "Trainer"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Client_pinHash_key" ON "Client"("pinHash");

-- CreateIndex
CREATE UNIQUE INDEX "Client_pinLookup_key" ON "Client"("pinLookup");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramDay_clientId_volgorde_key" ON "ProgramDay"("clientId", "volgorde");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramItem_dayId_volgorde_key" ON "ProgramItem"("dayId", "volgorde");

-- CreateIndex
CREATE INDEX "Session_clientId_idx" ON "Session"("clientId");

-- CreateIndex
CREATE INDEX "SetLog_sessionId_idx" ON "SetLog"("sessionId");

-- CreateIndex
CREATE INDEX "SetLog_programItemId_idx" ON "SetLog"("programItemId");

-- CreateIndex
CREATE INDEX "SetLog_oefeningNaam_idx" ON "SetLog"("oefeningNaam");

-- CreateIndex
CREATE UNIQUE INDEX "SetLog_sessionId_oefeningNaam_setNr_key" ON "SetLog"("sessionId", "oefeningNaam", "setNr");

-- CreateIndex
CREATE INDEX "LibraryExercise_primaireSpier_idx" ON "LibraryExercise"("primaireSpier");

-- CreateIndex
CREATE INDEX "LibraryExercise_doel_idx" ON "LibraryExercise"("doel");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryExercise_bron_bronId_key" ON "LibraryExercise"("bron", "bronId");

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_programItemId_fkey" FOREIGN KEY ("programItemId") REFERENCES "ProgramItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
