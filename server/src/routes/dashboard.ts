import { Router } from "express";
import { prisma } from "../db";
import { requireTrainer } from "../middleware/auth";
import { fmtNumber, isoWeek } from "../lib/schedule";

const router = Router();
router.use(requireTrainer);

function sessionVolume(setLogs: { unit: string; gewichtKg: number | null; reps: number | null }[]): number {
  return setLogs.reduce((sum, s) => {
    if (s.unit !== "kg" || s.gewichtKg == null) return sum;
    return sum + s.gewichtKg * (s.reps || 0);
  }, 0);
}

router.get("/clients/:id/dashboard", async (req, res) => {
  const clientId = req.params.id;
  const now = new Date();
  const sessions = await prisma.session.findMany({
    where: { clientId, afgerondOp: { not: null } },
    orderBy: { afgerondOp: "desc" },
    include: { setLogs: true, day: true },
    take: 60,
  });

  const days28 = 28 * 24 * 60 * 60 * 1000;
  const last28 = sessions.filter((s) => s.afgerondOp && now.getTime() - s.afgerondOp.getTime() <= days28);
  const prev28 = sessions.filter(
    (s) => s.afgerondOp && now.getTime() - s.afgerondOp.getTime() > days28 && now.getTime() - s.afgerondOp.getTime() <= 2 * days28
  );

  const curWeek = isoWeek(now);
  const thisWeekSessions = sessions.filter((s) => s.afgerondOp && isoWeek(s.afgerondOp) === curWeek);
  const lastWeekSessions = sessions.filter((s) => s.afgerondOp && isoWeek(s.afgerondOp) === curWeek - 1);
  const volThisWeek = thisWeekSessions.reduce((a, s) => a + sessionVolume(s.setLogs), 0);
  const volLastWeek = lastWeekSessions.reduce((a, s) => a + sessionVolume(s.setLogs), 0);
  const volDeltaPct = volLastWeek > 0 ? Math.round(((volThisWeek - volLastWeek) / volLastWeek) * 100) : null;

  // PRs this month: exercises whose heaviest set this month beats every set logged before this month.
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const byExercise = new Map<string, { name: string; kg: number; when: Date }[]>();
  sessions.forEach((s) => {
    if (!s.afgerondOp) return;
    s.setLogs.forEach((l) => {
      if (l.unit !== "kg" || l.gewichtKg == null) return;
      const arr = byExercise.get(l.oefeningNaam) || [];
      arr.push({ name: l.oefeningNaam, kg: l.gewichtKg, when: s.afgerondOp! });
      byExercise.set(l.oefeningNaam, arr);
    });
  });
  let prCount = 0;
  const prNames: string[] = [];
  byExercise.forEach((entries, name) => {
    const before = entries.filter((e) => e.when < monthAgo).map((e) => e.kg);
    const during = entries.filter((e) => e.when >= monthAgo).map((e) => e.kg);
    if (!during.length) return;
    const maxBefore = before.length ? Math.max(...before) : 0;
    const maxDuring = Math.max(...during);
    if (maxDuring > maxBefore) {
      prCount++;
      prNames.push(name);
    }
  });

  const painLast30 = sessions.filter(
    (s) => s.pijn && s.afgerondOp && now.getTime() - s.afgerondOp.getTime() <= 30 * 24 * 60 * 60 * 1000
  );

  const kpis = [
    {
      label: "Trainingen 4 weken",
      value: String(last28.length),
      delta: prev28.length ? `${last28.length - prev28.length >= 0 ? "+" : ""}${last28.length - prev28.length} t.o.v. vorige 4 weken` : "eerste periode",
    },
    {
      label: "Volume deze week",
      value: `${fmtNumber(volThisWeek / 1000)} t`,
      delta: volDeltaPct == null ? "geen vergelijking" : `${volDeltaPct >= 0 ? "+" : ""}${volDeltaPct}% t.o.v. vorige week`,
    },
    { label: "Records deze maand", value: String(prCount), delta: prNames.slice(0, 3).join(", ") || "nog geen" },
    {
      label: "Pijnmeldingen",
      value: String(painLast30.length),
      delta: painLast30[0]?.afgerondOp ? new Date(painLast30[0].afgerondOp).toLocaleDateString("nl-BE") : "geen",
    },
  ];

  const volumeRows = sessions
    .slice(0, 6)
    .reverse()
    .map((s) => ({
      label: s.afgerondOp ? new Date(s.afgerondOp).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" }) : "",
      val: sessionVolume(s.setLogs) / 1000,
    }));

  const notes = sessions
    .filter((s) => s.opmerking || s.pijn)
    .slice(0, 6)
    .map((s) => ({
      when: s.afgerondOp ? new Date(s.afgerondOp).toLocaleDateString("nl-BE", { day: "2-digit", month: "long" }) : "",
      day: s.day.titel,
      pain: s.pijn,
      text: s.opmerking || "",
    }));

  const last = sessions[0];
  let lastSessionMeta = "Nog geen sessies afgerond.";
  let sessionRows: unknown[] = [];
  if (last) {
    const durationMin = last.afgerondOp ? Math.max(1, Math.round((last.afgerondOp.getTime() - last.gestartOp.getTime()) / 60000)) : null;
    lastSessionMeta = `${last.day.titel} · ${last.afgerondOp ? new Date(last.afgerondOp).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" }) : ""}${durationMin ? " · " + durationMin + " min" : ""}${last.rpe != null ? " · zwaarte-score “" + ["Licht", "Vlot", "Goed", "Zwaar", "Max"][last.rpe] + "”" : ""}`;

    // group set logs by exercise, take heaviest/most recent per exercise
    const grouped = new Map<string, typeof last.setLogs>();
    last.setLogs.forEach((l) => {
      const arr = grouped.get(l.oefeningNaam) || [];
      arr.push(l);
      grouped.set(l.oefeningNaam, arr);
    });
    const prevSession = sessions.find((s) => s.dayId === last.dayId && s.id !== last.id && s.afgerondOp);

    sessionRows = Array.from(grouped.entries()).map(([name, logs]) => {
      const best = logs.reduce((a, b) => ((b.gewichtKg || b.seconden || 0) > (a.gewichtKg || a.seconden || 0) ? b : a));
      const prevLogs = prevSession?.setLogs.filter((l) => l.oefeningNaam === name) || [];
      const prevBest = prevLogs.length
        ? prevLogs.reduce((a, b) => ((b.gewichtKg || b.seconden || 0) > (a.gewichtKg || a.seconden || 0) ? b : a))
        : null;
      const unit = best.unit;
      const actualVal = unit === "kg" ? best.gewichtKg : unit === "min" ? (best.seconden || 0) / 60 : best.seconden;
      const prevVal = prevBest ? (unit === "kg" ? prevBest.gewichtKg : unit === "min" ? (prevBest.seconden || 0) / 60 : prevBest.seconden) : null;
      const diff = actualVal != null && prevVal != null ? actualVal - prevVal : null;
      return {
        name,
        target: `${logs.length}×${best.reps ?? ""}`,
        prev: prevVal == null ? "—" : `${fmtNumber(prevVal)} ${unit}`,
        actual: actualVal == null ? "—" : `${fmtNumber(actualVal)} ${unit}`,
        delta: diff == null ? "—" : diff === 0 ? "=" : `${diff > 0 ? "+" : "−"}${fmtNumber(Math.abs(diff))} ${unit}`,
      };
    });
  }

  res.json({ kpis, volumeRows, notes, lastSessionMeta, sessionRows });
});

router.get("/clients/:id/chart-exercises", async (req, res) => {
  const rows = await prisma.setLog.groupBy({
    by: ["oefeningNaam"],
    where: { unit: "kg", session: { clientId: req.params.id } },
    _count: { oefeningNaam: true },
    orderBy: { _count: { oefeningNaam: "desc" } },
    take: 6,
  });
  res.json(rows.map((r) => r.oefeningNaam));
});

router.get("/clients/:id/progress", async (req, res) => {
  const exercise = String(req.query.exercise || "");
  if (!exercise) {
    res.json([]);
    return;
  }
  const sessions = await prisma.session.findMany({
    where: { clientId: req.params.id, afgerondOp: { not: null } },
    orderBy: { afgerondOp: "asc" },
    include: { setLogs: { where: { oefeningNaam: exercise, unit: "kg" } } },
  });
  const withLogs = sessions.filter((s) => s.setLogs.length).slice(-8);
  res.json(
    withLogs.map((s) => ({
      label: s.afgerondOp ? `w${isoWeek(s.afgerondOp)}` : "",
      val: Math.max(...s.setLogs.map((l) => l.gewichtKg || 0)),
    }))
  );
});

export default router;
