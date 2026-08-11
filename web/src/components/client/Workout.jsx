import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { fmt } from "../../lib/styles.js";

const BLOCK_LABEL = { warmup: "Warming up", main: "Main", cooldown: "Cooldown" };
const BLOCK_ORDER = ["warmup", "main", "cooldown"];

function unitOf(ex) {
  return ex.unit || (ex.type === "time" && !ex.doelgewicht ? "sec" : "kg");
}

function targetLabel(ex) {
  if (ex.unit === "min") return fmt(ex.target) + " min";
  return ex.type === "time" && !ex.doelgewicht ? ex.target + " sec" : ex.target + "×";
}

export default function Workout({ session, setSession, onHome, onFinish }) {
  const [openKey, setOpenKey] = useState(null);
  const [removed, setRemoved] = useState({}); // `${key}:${setNr}` -> true
  const [rest, setRest] = useState(null); // { label, secondsLeft, total }

  useEffect(() => {
    if (!rest) return;
    if (rest.secondsLeft <= 0) return;
    const t = setInterval(() => {
      setRest((r) => (r ? { ...r, secondsLeft: r.secondsLeft - 1 } : r));
    }, 1000);
    return () => clearInterval(t);
  }, [rest]);

  const exercises = session.exercises;

  function updateExercise(exKey, updater) {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((ex) => (ex.key === exKey ? updater(ex) : ex)),
    }));
  }

  function updateSetLocal(exKey, setNr, patch) {
    updateExercise(exKey, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.setNr === setNr ? { ...s, ...patch } : s)),
    }));
  }

  function persistSet(ex, s, patch) {
    const merged = { ...s, ...patch };
    const unit = unitOf(ex);
    api
      .putSet(session.id, {
        programItemId: ex.programItemId,
        oefeningNaam: ex.naam,
        setNr: s.setNr,
        reps: merged.reps ?? null,
        gewichtKg: unit === "kg" ? Number(merged.value) || 0 : null,
        seconden: unit === "sec" || unit === "min" ? Number(merged.value) || 0 : null,
        unit,
        afgevinkt: !!merged.afgevinkt,
      })
      .catch(() => {});
  }

  function onValueChange(ex, s, value) {
    updateSetLocal(ex.key, s.setNr, { value });
    persistSet(ex, s, { value });
  }

  function onRepsChange(ex, s, reps) {
    updateSetLocal(ex.key, s.setNr, { reps });
    persistSet(ex, s, { reps });
  }

  function toggleDone(ex, s) {
    const next = !s.afgevinkt;
    updateSetLocal(ex.key, s.setNr, { afgevinkt: next });
    persistSet(ex, s, { afgevinkt: next });
    if (next && ex.restSec > 0) {
      setRest({ label: ex.naam, secondsLeft: ex.restSec, total: ex.restSec });
    }
  }

  function removeSet(ex, s) {
    setRemoved((r) => ({ ...r, [`${ex.key}:${s.setNr}`]: true }));
    api.deleteSet(session.id, ex.naam, s.setNr).catch(() => {});
  }

  function restoreSets(ex) {
    setRemoved((r) => {
      const next = { ...r };
      ex.sets.forEach((s) => delete next[`${ex.key}:${s.setNr}`]);
      return next;
    });
  }

  const blocks = useMemo(() => {
    return BLOCK_ORDER.map((b) => ({
      id: b,
      title: BLOCK_LABEL[b],
      exercises: exercises.filter((e) => e.block === b),
    })).filter((b) => b.exercises.length);
  }, [exercises]);

  const { totalSets, doneCount, volume } = useMemo(() => {
    let total = 0;
    let done = 0;
    let vol = 0;
    exercises.forEach((ex) => {
      const unit = unitOf(ex);
      ex.sets.forEach((s) => {
        if (removed[`${ex.key}:${s.setNr}`]) return;
        total++;
        if (s.afgevinkt) {
          done++;
          if (unit === "kg") vol += (Number(s.value) || 0) * (Number(s.reps) || 0);
        }
      });
    });
    return { totalSets: total, doneCount: done, volume: vol };
  }, [exercises, removed]);

  const progressPct = totalSets ? Math.round((doneCount / totalSets) * 100) : 0;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ flex: "none", padding: "8px 16px 12px", borderBottom: "1px solid #e8ebee", background: "#eef1f4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onHome} style={{ width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
            ‹
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>{session.day.titel}</div>
            <div style={{ fontSize: 11.5, color: "#8b8f94" }}>{doneCount} van {totalSets} sets afgewerkt</div>
          </div>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#1f5dc4" }}>{progressPct}%</div>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "#e8ebee", marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, transition: "width .3s", background: "linear-gradient(90deg,#2c9dfd,#1f5dc4)", width: progressPct + "%" }} />
        </div>
      </div>

      <div style={{ padding: "14px 12px 140px" }}>
        {blocks.map((b) => (
          <div key={b.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 8px" }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{b.title}</div>
              <div style={{ flex: 1, height: 1, background: "#e8ebee" }} />
              <div style={{ fontSize: 11, color: "#c2c8cf" }}>{b.exercises.length} oefeningen</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {b.exercises.map((ex) => (
                <ExerciseCard
                  key={ex.key}
                  ex={ex}
                  isOpen={openKey === ex.key}
                  onToggleOpen={() => setOpenKey(openKey === ex.key ? null : ex.key)}
                  removed={removed}
                  onValueChange={onValueChange}
                  onRepsChange={onRepsChange}
                  onToggleDone={toggleDone}
                  onRemoveSet={removeSet}
                  onRestoreSets={restoreSets}
                />
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => onFinish({ doneSets: doneCount, doneVolume: fmt(volume) })}
          style={{
            marginTop: 6,
            width: "100%",
            height: 54,
            borderRadius: 999,
            border: 0,
            background: "#000",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Training afronden
        </button>
      </div>

      {rest && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 16,
            width: "min(452px, calc(100% - 28px))",
            background: "#000",
            color: "#fff",
            borderRadius: 18,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 16px 32px rgba(10,14,20,.3)",
          }}
        >
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 26, minWidth: 74 }}>
            {Math.floor(Math.max(0, rest.secondsLeft) / 60)}:{String(Math.max(0, rest.secondsLeft) % 60).padStart(2, "0")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "#c7c9cc" }}>Rust · {rest.label}</div>
            <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,.16)", marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 999, background: "#2c9dfd", width: Math.round((Math.max(0, rest.secondsLeft) / rest.total) * 100) + "%" }} />
            </div>
          </div>
          <button onClick={() => setRest(null)} style={{ flex: "none", padding: "9px 14px", border: "1px solid rgba(255,255,255,.22)", background: "transparent", color: "#fff", borderRadius: 999, fontSize: 12.5, cursor: "pointer" }}>
            Overslaan
          </button>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, isOpen, onToggleOpen, removed, onValueChange, onRepsChange, onToggleDone, onRemoveSet, onRestoreSets }) {
  const unit = unitOf(ex);
  const visibleSets = ex.sets.filter((s) => !removed[`${ex.key}:${s.setNr}`]);
  const doneCount = visibleSets.filter((s) => s.afgevinkt).length;
  const complete = visibleSets.length > 0 && doneCount === visibleSets.length;
  const anyRemoved = ex.sets.some((s) => removed[`${ex.key}:${s.setNr}`]);
  const isMin = ex.unit === "min";
  const videoUrl = ex.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.naam + " oefening techniek")}`;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        border: "1.5px solid " + (complete ? "rgba(44,157,253,.4)" : "#e8ebee"),
        boxShadow: isOpen ? "0 4px 10px rgba(10,14,20,.08),0 16px 32px rgba(10,14,20,.08)" : "0 1px 2px rgba(10,14,20,.05)",
      }}
    >
      <button onClick={onToggleOpen} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, background: "transparent", border: 0, textAlign: "left", cursor: "pointer" }}>
        <div
          style={{
            flex: "none",
            width: 38,
            height: 38,
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            background: complete ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "#f4f6f8",
            color: complete ? "#fff" : "#8b8f94",
          }}
        >
          {complete ? "✓" : `${doneCount}/${visibleSets.length}`}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#000", lineHeight: 1.25 }}>{ex.naam}</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>
            {isMin
              ? `${fmt(ex.target)} min`
              : `${visibleSets.length} × ${targetLabel(ex)}${unit === "kg" && ex.doelgewicht ? " · " + fmt(ex.doelgewicht) + " kg" : ""} · rust ${ex.restSec}s`}
          </div>
        </div>
        <div style={{ flex: "none", fontSize: 20, color: "#c2c8cf", transition: "transform .14s", transform: `rotate(${isOpen ? 90 : 0}deg)` }}>›</div>
      </button>

      {isOpen && (
        <div style={{ padding: "0 14px 14px" }}>
          {ex.notitie && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#7c8794", background: "#f4f6f8", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              {ex.notitie}
            </div>
          )}
          <a href={videoUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", border: "1.5px solid #e8ebee", borderRadius: 10, marginBottom: 12, textDecoration: "none" }}>
            <span style={{ flex: "none", width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>▶</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1f5dc4" }}>Bekijk de techniekvideo</span>
          </a>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleSets.map((s, i) => (
              <div key={s.setNr} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 40, flex: "none", fontSize: 12, color: "#8b8f94" }}>{isMin ? "Roeitijd" : `Set ${i + 1}`}</div>

                {!isMin && (
                  <div style={{ width: 86, flex: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1.5px solid #e8ebee", borderRadius: 10, padding: "6px 8px", background: "#fff" }}>
                      <input
                        type="number"
                        value={s.reps ?? ""}
                        onChange={(e) => onRepsChange(ex, s, Number(e.target.value))}
                        style={{ width: 42, flex: "none", border: 0, outline: "none", fontSize: 15, fontWeight: 600, color: "#000", background: "transparent" }}
                      />
                      <span style={{ fontSize: 11, color: "#8b8f94", flex: "none" }}>{ex.type === "time" ? "sec" : "herh."}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#c2c8cf", marginTop: 3, paddingLeft: 2 }}>doel {targetLabel(ex)}</div>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e8ebee", borderRadius: 10, padding: "6px 10px", background: "#fff" }}>
                    <input
                      type="number"
                      step={unit === "kg" ? 2.5 : unit === "min" ? 1 : 5}
                      value={s.value ?? ""}
                      onChange={(e) => onValueChange(ex, s, Number(e.target.value))}
                      style={{ width: "100%", border: 0, outline: "none", fontSize: 16, fontWeight: 600, color: "#000", background: "transparent" }}
                    />
                    <span style={{ fontSize: 12, color: "#8b8f94", flex: "none" }}>{unit}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#c2c8cf", marginTop: 3, paddingLeft: 2 }}>{s.prevLabel}</div>
                </div>

                <button
                  onClick={() => onToggleDone(ex, s)}
                  style={{
                    flex: "none",
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    fontSize: 16,
                    cursor: "pointer",
                    transition: "all .14s",
                    border: "1.5px solid " + (s.afgevinkt ? "#1f5dc4" : "#e8ebee"),
                    background: s.afgevinkt ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "#fff",
                    color: s.afgevinkt ? "#fff" : "#c2c8cf",
                  }}
                >
                  ✓
                </button>
                {!isMin && (
                  <button
                    onClick={() => onRemoveSet(ex, s)}
                    disabled={visibleSets.length <= 1}
                    title="Set verwijderen"
                    style={{
                      flex: "none",
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1.5px solid #e8ebee",
                      background: "#fff",
                      color: "#c2c8cf",
                      fontSize: 15,
                      cursor: visibleSets.length <= 1 ? "default" : "pointer",
                      opacity: visibleSets.length <= 1 ? 0.35 : 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {anyRemoved && (
            <button
              onClick={() => onRestoreSets(ex)}
              style={{ marginTop: 12, width: "100%", height: 40, border: "1.5px solid #e8ebee", background: "#fff", color: "#8b8f94", borderRadius: 999, fontSize: 13, cursor: "pointer" }}
            >
              Verwijderde sets terugzetten
            </button>
          )}
        </div>
      )}
    </div>
  );
}
