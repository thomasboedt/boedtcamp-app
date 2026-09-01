import { Router } from "express";
import { prisma } from "../db";
import { requireTrainer } from "../middleware/auth";
import { isoAdd, isoToday } from "../lib/date";
import { deriveMeasCalc, measZone } from "../lib/measurements";

const router = Router();
router.use(requireTrainer);

const NL_DATE = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
};

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

router.get("/clients/:id/measurements", async (req, res) => {
  const clientId = req.params.id;
  const today = isoToday();
  const since = isoAdd(today, -30);

  const rows = await prisma.measurement.findMany({
    where: { clientId, dateIso: { gte: since, lte: today } },
    orderBy: { dateIso: "asc" },
  });

  if (!rows.length) {
    res.json({ latestDate: null, seriesCount: 0, kpis: [], series: {}, feel: [], rows: [] });
    return;
  }

  const first = rows[0];
  const last = rows[rows.length - 1];
  const firstCalc = deriveMeasCalc(first);
  const lastCalc = deriveMeasCalc(last);

  const delta = (a: number | null, b: number | null, unit: string, digits = 1) => {
    if (rows.length < 2 || a === null || a === undefined || b === null || b === undefined) return "";
    const d = Math.round((b - a) * Math.pow(10, digits)) / Math.pow(10, digits);
    return `${d > 0 ? "+" : ""}${fmt(d, digits)} ${unit} in 30 dagen`;
  };

  const kpis = [
    { label: "Gewicht", value: last.weight ? `${fmt(last.weight)} kg` : "—", sub: delta(first.weight, last.weight, "kg") },
    { label: "Vetpercentage", value: last.fat ? `${fmt(last.fat)} %` : "—", sub: delta(first.fat, last.fat, "%") },
    { label: "Spiermassa", value: last.muscle ? `${fmt(last.muscle)} kg` : "—", sub: delta(first.muscle, last.muscle, "kg") },
    { label: "BMI", value: lastCalc.bmi ? fmt(lastCalc.bmi) : "—", sub: measZone("bmi", lastCalc.bmi).label },
    { label: "Visceraal vet", value: last.visceral ?? "—", sub: last.visceral && last.visceral > 12 ? "opvolgen" : "binnen bereik" },
    { label: "Middel / heup", value: lastCalc.whr ? fmt(lastCalc.whr, 2) : "—", sub: measZone("whr", lastCalc.whr).label },
    { label: "Middel / lengte", value: lastCalc.whtr ? fmt(lastCalc.whtr, 2) : "—", sub: measZone("whtr", lastCalc.whtr).label },
    { label: "Lichaamsvocht", value: last.water ? `${fmt(last.water)} %` : "—", sub: delta(first.water, last.water, "%") },
  ];

  const series: Record<string, { iso: string; label: string; val: number }[]> = {};
  (["weight", "fat", "muscle", "water", "waist", "hip"] as const).forEach((key) => {
    series[key] = rows.filter((r) => r[key] !== null).map((r) => ({ iso: r.dateIso, label: NL_DATE(r.dateIso), val: r[key] as number }));
  });
  series.bmi = rows.map((r) => ({ iso: r.dateIso, label: NL_DATE(r.dateIso), val: deriveMeasCalc(r).bmi })).filter((r) => r.val);

  const avg = (key: "stress" | "sleep" | "energy") => {
    const vals = rows.map((r) => r[key]).filter((v): v is number => v !== null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  const spark = (key: "stress" | "sleep" | "energy") =>
    rows.slice(-14).map((r) => ({ iso: r.dateIso, val: r[key] ?? 0 }));

  const feel = [
    { key: "stress", label: "Stress", value: avg("stress") ?? "—", spark: spark("stress") },
    { key: "sleep", label: "Slaapgevoel", value: avg("sleep") ?? "—", spark: spark("sleep") },
    { key: "energy", label: "Energieniveau", value: avg("energy") ?? "—", spark: spark("energy") },
  ];

  const tableRows = rows
    .slice(-14)
    .reverse()
    .map((r) => {
      const c = deriveMeasCalc(r);
      return {
        dateIso: r.dateIso,
        dateLabel: NL_DATE(r.dateIso),
        weight: r.weight !== null ? fmt(r.weight) : "—",
        fat: r.fat !== null ? fmt(r.fat) : "—",
        muscle: r.muscle !== null ? fmt(r.muscle) : "—",
        water: r.water !== null ? fmt(r.water) : "—",
        visceral: r.visceral ?? "—",
        waist: r.waist !== null ? fmt(r.waist) : "—",
        hip: r.hip !== null ? fmt(r.hip) : "—",
        bmi: c.bmi ? fmt(c.bmi) : "—",
        bmiZone: measZone("bmi", c.bmi).color,
        whr: c.whr ? fmt(c.whr, 2) : "—",
        whrZone: measZone("whr", c.whr).color,
        whtr: c.whtr ? fmt(c.whtr, 2) : "—",
        whtrZone: measZone("whtr", c.whtr).color,
        feel: `${r.stress ?? "–"} / ${r.sleep ?? "–"} / ${r.energy ?? "–"}`,
      };
    });

  res.json({
    latestDate: NL_DATE(last.dateIso),
    seriesCount: rows.length,
    kpis,
    series,
    feel,
    rows: tableRows,
  });
});

export default router;
