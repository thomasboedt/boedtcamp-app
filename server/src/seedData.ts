import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { hashPin, pinLookupHash } from "./auth";

const VIDEOS: Record<string, string> = {
  Squat: "https://www.youtube.com/watch?v=ultWZbUMPL8",
  "Bench press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  Deadlift: "https://www.youtube.com/watch?v=op9kVnSso6Q",
  "Pull up (met band)": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
  "Shoulder press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
  "Reverse lunge (per been)": "https://www.youtube.com/watch?v=xrPFzobD8Ks",
  "Biceps curl": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  "Lunge (per been)": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
  "Single romanian deadlift": "https://www.youtube.com/watch?v=1uDiW5--rAE",
  "Bent over row": "https://www.youtube.com/watch?v=vT2GjY_Umpw",
  "Incline chest fly 45°": "https://www.youtube.com/watch?v=8oR9m5KOWKI",
  "Lateral raise dumbbell": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "Hammer curl": "https://www.youtube.com/watch?v=zC3nLlEvin4",
  "Triceps kick back": "https://www.youtube.com/watch?v=6SS6K3lAwZ8",
  "Roeien · continu tempo": "https://www.youtube.com/watch?v=zQ82RYIFLN8",
};

type Item = {
  naam: string;
  block: "warmup" | "main" | "cooldown";
  type?: "reps" | "time";
  unit?: string | null;
  sets: number;
  repsOfSec: number;
  doelgewicht?: number;
  restSec: number;
  notitie?: string;
};

function scaleLoad(load: number, scale: number): number {
  return Math.max(1, Math.round((load * scale) / 2.5) * 2.5);
}

function day1(scale: number): Item[] {
  return [
    { naam: "Squat", block: "main", sets: 4, repsOfSec: 6, doelgewicht: scaleLoad(55, scale), restSec: 120, notitie: "Rustig zakken (3 tellen), krachtig omhoog. Knieën in lijn met de tenen." },
    { naam: "Bench press", block: "main", sets: 4, repsOfSec: 8, doelgewicht: scaleLoad(32.5, scale), restSec: 120, notitie: "Schouderbladen ingetrokken, stang tot midden borst." },
    { naam: "Deadlift", block: "main", sets: 3, repsOfSec: 5, doelgewicht: scaleLoad(70, scale), restSec: 150, notitie: "Rug neutraal. Stop de set zodra de vorm verandert." },
    { naam: "Pull up (met band)", block: "main", sets: 3, repsOfSec: 6, doelgewicht: 0, unit: "band", restSec: 120, notitie: "Groene band als ondersteuning. Volledig strekken onderaan." },
    { naam: "Shoulder press", block: "main", sets: 3, repsOfSec: 10, doelgewicht: scaleLoad(14, scale), restSec: 90 },
    { naam: "Reverse lunge (per been)", block: "main", sets: 3, repsOfSec: 10, doelgewicht: scaleLoad(12, scale), restSec: 90, notitie: "Stap achteruit, romp rechtop. Houd je vast als je wankelt." },
    { naam: "Biceps curl", block: "main", sets: 3, repsOfSec: 12, doelgewicht: scaleLoad(9, scale), restSec: 60 },
  ];
}

function day2(scale: number): Item[] {
  return [
    { naam: "Lunge (per been)", block: "main", sets: 4, repsOfSec: 10, doelgewicht: scaleLoad(14, scale), restSec: 120 },
    { naam: "Single romanian deadlift", block: "main", sets: 3, repsOfSec: 8, doelgewicht: scaleLoad(16, scale), restSec: 90, notitie: "Eén been, heup scharniert. Steunpunt gebruiken mag." },
    { naam: "Bent over row", block: "main", sets: 4, repsOfSec: 10, doelgewicht: scaleLoad(30, scale), restSec: 120 },
    { naam: "Incline chest fly 45°", block: "main", sets: 3, repsOfSec: 12, doelgewicht: scaleLoad(8, scale), restSec: 90, notitie: "Lichte buiging in de elleboog, brede boog." },
    { naam: "Lateral raise dumbbell", block: "main", sets: 3, repsOfSec: 14, doelgewicht: scaleLoad(5, scale), restSec: 60 },
    { naam: "Hammer curl", block: "main", sets: 3, repsOfSec: 12, doelgewicht: scaleLoad(9, scale), restSec: 60 },
    { naam: "Triceps kick back", block: "main", sets: 3, repsOfSec: 12, doelgewicht: scaleLoad(5, scale), restSec: 60 },
  ];
}

function day3(scale: number): Item[] {
  return [
    { naam: "Dead bug (langzaam)", block: "cooldown", type: "time", sets: 3, repsOfSec: 45, restSec: 30, notitie: "Onderrug blijft plat op de mat. Adem rustig uit bij het strekken." },
    { naam: "Side plank (per zijde)", block: "cooldown", type: "time", sets: 3, repsOfSec: 30, restSec: 30 },
    { naam: "Single leg stance + reik", block: "cooldown", type: "time", sets: 3, repsOfSec: 40, restSec: 30, notitie: "Op één been staan en met de hand naar de grond reiken. Steun bij de hand houden mag." },
    { naam: "Bird dog", block: "cooldown", type: "time", sets: 3, repsOfSec: 40, restSec: 30 },
    { naam: "Pallof press", block: "cooldown", sets: 3, repsOfSec: 12, doelgewicht: scaleLoad(10, scale), restSec: 45, notitie: "Romp blijft stil, alleen de armen bewegen." },
    { naam: "Suitcase carry", block: "cooldown", type: "time", sets: 2, repsOfSec: 40, doelgewicht: scaleLoad(16, scale), restSec: 45 },
  ];
}

const LIBRARY: { naam: string; primaireSpier: string; materiaal: string; doel: string; type: "reps" | "time" }[] = [
  { naam: "Front squat", primaireSpier: "quadriceps", materiaal: "barbell", doel: "strength", type: "reps" },
  { naam: "Goblet squat", primaireSpier: "quadriceps", materiaal: "dumbbell", doel: "strength", type: "reps" },
  { naam: "Romanian deadlift", primaireSpier: "hamstrings", materiaal: "barbell", doel: "strength", type: "reps" },
  { naam: "Hip thrust", primaireSpier: "glutes", materiaal: "barbell", doel: "strength", type: "reps" },
  { naam: "Step up (per been)", primaireSpier: "quadriceps", materiaal: "dumbbell", doel: "strength", type: "reps" },
  { naam: "Bulgarian split squat", primaireSpier: "quadriceps", materiaal: "dumbbell", doel: "strength", type: "reps" },
  { naam: "Leg press", primaireSpier: "quadriceps", materiaal: "machine", doel: "strength", type: "reps" },
  { naam: "Calf raise", primaireSpier: "calves", materiaal: "dumbbell", doel: "strength", type: "reps" },
  { naam: "Lat pulldown", primaireSpier: "lats", materiaal: "machine", doel: "strength", type: "reps" },
  { naam: "Seated row", primaireSpier: "middle back", materiaal: "machine", doel: "strength", type: "reps" },
  { naam: "Face pull", primaireSpier: "shoulders", materiaal: "cable", doel: "strength", type: "reps" },
  { naam: "Incline dumbbell press", primaireSpier: "chest", materiaal: "dumbbell", doel: "strength", type: "reps" },
  { naam: "Push up", primaireSpier: "chest", materiaal: "geen materiaal", doel: "strength", type: "reps" },
  { naam: "Dips (assisted)", primaireSpier: "triceps", materiaal: "machine", doel: "strength", type: "reps" },
  { naam: "Triceps pushdown", primaireSpier: "triceps", materiaal: "cable", doel: "strength", type: "reps" },
  { naam: "Farmer carry", primaireSpier: "forearms", materiaal: "dumbbell", doel: "strength", type: "time" },
  { naam: "Plank", primaireSpier: "abdominals", materiaal: "geen materiaal", doel: "core", type: "time" },
  { naam: "Hollow hold", primaireSpier: "abdominals", materiaal: "geen materiaal", doel: "core", type: "time" },
  { naam: "Ab rollout", primaireSpier: "abdominals", materiaal: "wheel", doel: "core", type: "reps" },
  { naam: "Cat-cow", primaireSpier: "lower back", materiaal: "geen materiaal", doel: "mobility", type: "time" },
  { naam: "Thoracic opener", primaireSpier: "middle back", materiaal: "geen materiaal", doel: "mobility", type: "time" },
  { naam: "90/90 heupwissel", primaireSpier: "glutes", materiaal: "geen materiaal", doel: "mobility", type: "time" },
  { naam: "World's greatest stretch", primaireSpier: "hamstrings", materiaal: "geen materiaal", doel: "mobility", type: "time" },
  { naam: "Enkelmobiliteit", primaireSpier: "calves", materiaal: "geen materiaal", doel: "mobility", type: "time" },
  { naam: "Schouderdislocaties", primaireSpier: "shoulders", materiaal: "band", doel: "mobility", type: "time" },
  { naam: "Heupbuiger rek", primaireSpier: "hip flexors", materiaal: "geen materiaal", doel: "mobility", type: "time" },
  { naam: "Band pull-apart", primaireSpier: "shoulders", materiaal: "band", doel: "mobility", type: "time" },
  { naam: "Copenhagen plank", primaireSpier: "adductors", materiaal: "bench", doel: "stability", type: "time" },
  { naam: "Clamshell", primaireSpier: "glutes", materiaal: "band", doel: "stability", type: "reps" },
  { naam: "Wall slide", primaireSpier: "shoulders", materiaal: "geen materiaal", doel: "stability", type: "reps" },
  { naam: "Turkish get-up", primaireSpier: "abdominals", materiaal: "kettlebell", doel: "stability", type: "reps" },
  { naam: "Glute bridge", primaireSpier: "glutes", materiaal: "geen materiaal", doel: "stability", type: "reps" },
  { naam: "Box jump", primaireSpier: "quadriceps", materiaal: "box", doel: "power", type: "reps" },
  { naam: "Kettlebell swing", primaireSpier: "glutes", materiaal: "kettlebell", doel: "power", type: "reps" },
  { naam: "Medicine ball slam", primaireSpier: "abdominals", materiaal: "medicine ball", doel: "power", type: "reps" },
  { naam: "Rowing (erg)", primaireSpier: "lats", materiaal: "machine", doel: "cardio", type: "time" },
  { naam: "Fietsen (hometrainer)", primaireSpier: "quadriceps", materiaal: "machine", doel: "cardio", type: "time" },
];

const DEMO_CLIENTS: {
  naam: string;
  meta: string;
  focus: string;
  freq: string;
  scale: number;
  pin: string;
  target: { kcal: number; pctCarbs: number; pctProtein: number; pctFat: number };
  days: { n: number; titel: string; rotate: boolean; rowing: boolean; rowBase: number; rowPct: number; rowWeek: number; items: Item[] }[];
}[] = [
  {
    naam: "Tania Dhaene",
    meta: "52 jaar · 1-op-1 · sinds maart 2026",
    focus: "Kracht opbouwen, rechterknie ontzien",
    freq: "2-3x per week",
    scale: 1,
    pin: "194823",
    target: { kcal: 1900, pctCarbs: 40, pctProtein: 25, pctFat: 35 },
    days: [
      { n: 1, titel: "Training 1 · Full body A", rotate: true, rowing: false, rowBase: 10, rowPct: 10, rowWeek: 3, items: day1(1) },
      { n: 2, titel: "Training 2 · Full body B", rotate: true, rowing: false, rowBase: 10, rowPct: 10, rowWeek: 3, items: day2(1) },
      { n: 3, titel: "Training 3 · Stabiliteit & roeien", rotate: false, rowing: true, rowBase: 10, rowPct: 10, rowWeek: 3, items: day3(1) },
    ],
  },
  {
    naam: "Koen & Ann Verlinden",
    meta: "62 & 59 jaar · duo-training",
    focus: "Rustige opbouw, veel mobiliteit",
    freq: "2x per week",
    scale: 0.65,
    pin: "305671",
    target: { kcal: 1750, pctCarbs: 40, pctProtein: 24, pctFat: 36 },
    days: [
      { n: 1, titel: "Training 1 · Full body A", rotate: true, rowing: false, rowBase: 8, rowPct: 8, rowWeek: 1, items: day1(0.65) },
      { n: 3, titel: "Training 3 · Stabiliteit & roeien", rotate: false, rowing: true, rowBase: 8, rowPct: 8, rowWeek: 1, items: day3(0.65) },
    ],
  },
  {
    naam: "Jens Peeters",
    meta: "17 jaar · basketbal",
    focus: "Explosiviteit en sprongkracht",
    freq: "4x per week",
    scale: 1.6,
    pin: "728490",
    target: { kcal: 3100, pctCarbs: 49, pctProtein: 22, pctFat: 29 },
    days: [
      { n: 1, titel: "Training 1 · Full body A", rotate: true, rowing: false, rowBase: 12, rowPct: 12, rowWeek: 5, items: day1(1.6) },
      { n: 2, titel: "Training 2 · Full body B", rotate: true, rowing: false, rowBase: 12, rowPct: 12, rowWeek: 5, items: day2(1.6) },
    ],
  },
];

export async function seedTrainer(prisma: PrismaClient, username: string, password: string) {
  await prisma.trainer.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash: await bcrypt.hash(password, 10) },
  });
}

export async function seedLibrary(prisma: PrismaClient) {
  for (const item of LIBRARY) {
    const bronId = item.naam.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.libraryExercise.upsert({
      where: { bron_bronId: { bron: "curated", bronId } },
      update: {},
      create: {
        naam: item.naam,
        primaireSpier: item.primaireSpier,
        materiaal: item.materiaal,
        doel: item.doel,
        type: item.type,
        bron: "curated",
        bronId,
      },
    });
  }
}

export async function seedDemoClients(prisma: PrismaClient) {
  for (const c of DEMO_CLIENTS) {
    const pinHash = await hashPin(c.pin);
    const pinLookup = pinLookupHash(c.pin);
    const client = await prisma.client.upsert({
      where: { pinLookup },
      update: {},
      create: { naam: c.naam, meta: c.meta, focus: c.focus, freq: c.freq, pinHash, pinLookup },
    });

    await prisma.nutritionTarget.upsert({
      where: { clientId: client.id },
      update: {},
      create: { clientId: client.id, ...c.target },
    });

    for (const d of c.days) {
      const day = await prisma.programDay.upsert({
        where: { clientId_volgorde: { clientId: client.id, volgorde: d.n } },
        update: {},
        create: {
          clientId: client.id,
          volgorde: d.n,
          titel: d.titel,
          rotate: d.rotate,
          rowing: d.rowing,
          rowBase: d.rowBase,
          rowPct: d.rowPct,
          rowWeek: d.rowWeek,
        },
      });
      for (let i = 0; i < d.items.length; i++) {
        const it = d.items[i];
        await prisma.programItem.upsert({
          where: { dayId_volgorde: { dayId: day.id, volgorde: i + 1 } },
          update: {},
          create: {
            dayId: day.id,
            volgorde: i + 1,
            naam: it.naam,
            block: it.block,
            type: it.type || "reps",
            unit: it.unit ?? null,
            sets: it.sets,
            repsOfSec: it.repsOfSec,
            doelgewicht: it.doelgewicht || 0,
            restSec: it.restSec,
            videoUrl: VIDEOS[it.naam] || null,
            notitie: it.notitie || null,
            bron: "eigen",
          },
        });
      }
    }
  }
  return DEMO_CLIENTS.map((c) => ({ naam: c.naam, pin: c.pin }));
}
