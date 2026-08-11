// Weekly-rotating core & mobility pools, and the progressive rowing formula.
// Ported 1:1 from the design prototype (BoedtCamp Krachttraining App.dc.html)
// so the app's behaviour matches what the trainer already approved.

export type PoolExercise = {
  id: string;
  naam: string;
  type: "reps" | "time";
  repsOfSec: number;
  doelgewicht?: number;
};

export const CORE_POOL: PoolExercise[] = [
  { id: "core-deadbug", naam: "Dead bug", type: "time", repsOfSec: 40 },
  { id: "core-plank", naam: "Plank", type: "time", repsOfSec: 45 },
  { id: "core-sideplank", naam: "Side plank (per zijde)", type: "time", repsOfSec: 30 },
  { id: "core-pallof", naam: "Pallof press", type: "reps", repsOfSec: 12, doelgewicht: 10 },
  { id: "core-birddog", naam: "Bird dog", type: "time", repsOfSec: 40 },
  { id: "core-hollow", naam: "Hollow hold", type: "time", repsOfSec: 30 },
  { id: "core-suitcase", naam: "Suitcase carry", type: "time", repsOfSec: 40, doelgewicht: 16 },
  { id: "core-rollout", naam: "Ab rollout", type: "reps", repsOfSec: 10 },
];

export const MOB_POOL: PoolExercise[] = [
  { id: "mob-catcow", naam: "Cat-cow", type: "time", repsOfSec: 45 },
  { id: "mob-thoracic", naam: "Thoracic opener", type: "time", repsOfSec: 45 },
  { id: "mob-9090", naam: "90/90 heupwissel", type: "time", repsOfSec: 60 },
  { id: "mob-wgs", naam: "World's greatest stretch", type: "time", repsOfSec: 60 },
  { id: "mob-ankle", naam: "Enkelmobiliteit", type: "time", repsOfSec: 45 },
  { id: "mob-shoulder", naam: "Schouderdislocaties", type: "time", repsOfSec: 45 },
  { id: "mob-hipflex", naam: "Heupbuiger rek", type: "time", repsOfSec: 60 },
  { id: "mob-pullapart", naam: "Band pull-apart", type: "time", repsOfSec: 45 },
];

export function isoWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

export function pickPool(list: PoolExercise[], count: number, offset: number): PoolExercise[] {
  const out: PoolExercise[] = [];
  const n = list.length;
  for (let i = 0; i < count; i++) out.push(list[((offset + i * 3) % n + n) % n]);
  return out;
}

export function rowMinutes(base: number, pct: number, week: number, weekOffset = 0): number {
  const w = Math.max(0, week + weekOffset);
  return Math.round(base * Math.pow(1 + pct / 100, w) * 10) / 10;
}

export function fmtNumber(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}
