export function rowMinutes(base, pct, week, weekOffset = 0) {
  const w = Math.max(0, week + weekOffset);
  return Math.round(base * Math.pow(1 + pct / 100, w) * 10) / 10;
}

export const GOALS = [
  { id: "all", nl: "Alle doelen" },
  { id: "mobility", nl: "Mobiliteit & rekken" },
  { id: "stability", nl: "Stabiliteit & evenwicht" },
  { id: "core", nl: "Core" },
  { id: "strength", nl: "Kracht" },
  { id: "power", nl: "Explosiviteit" },
  { id: "cardio", nl: "Cardio" },
];

export const BLOCK_OPTIONS = [
  { value: "warmup", label: "Warming up" },
  { value: "main", label: "Main" },
  { value: "cooldown", label: "Cooldown" },
];

export function goalBlock(goal) {
  if (goal === "mobility") return "warmup";
  if (goal === "stability" || goal === "core") return "cooldown";
  return "main";
}
