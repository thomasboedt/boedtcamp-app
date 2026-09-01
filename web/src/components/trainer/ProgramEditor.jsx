import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { segLight } from "../../lib/styles.js";
import Button from "../../ds/Button.jsx";
import { BLOCK_OPTIONS, GOALS, goalBlock, rowMinutes } from "../../lib/schedule.js";

const BLOCK_TAG = { warmup: "W", main: "M", cooldown: "C" };

export default function ProgramEditor({ client, clients }) {
  const [days, setDays] = useState([]);
  const [dayId, setDayId] = useState(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload(keepDayId) {
    const list = await api.getDays(client.id);
    setDays(list);
    setDayId(keepDayId && list.some((d) => d.id === keepDayId) ? keepDayId : list[0]?.id || null);
  }

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  function flash(msg) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function addDay() {
    const day = await api.addDay(client.id);
    await reload(day.id);
    flash("Trainingsdag toegevoegd");
  }

  async function removeDay() {
    if (days.length <= 1) return;
    if (!confirm("Deze trainingsdag verwijderen?")) return;
    await api.deleteDay(dayId);
    await reload();
    flash("Trainingsdag verwijderd");
  }

  async function patchDay(patch) {
    const updated = await api.updateDay(dayId, patch);
    setDays((ds) => ds.map((d) => (d.id === dayId ? { ...d, ...updated } : d)));
    flash("Opgeslagen");
  }

  if (loading) return <div style={{ marginTop: 24, color: "#8b8f94" }}>Laden…</div>;

  const day = days.find((d) => d.id === dayId);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}>
        {days.map((d) => (
          <button key={d.id} onClick={() => setDayId(d.id)} style={{ ...segLight(d.id === dayId), padding: "11px 18px", whiteSpace: "nowrap", border: "1.5px solid " + (d.id === dayId ? "#000" : "#e8ebee") }}>
            {d.titel}
          </button>
        ))}
        <button onClick={addDay} style={{ padding: "11px 18px", border: "1.5px dashed #c2c8cf", background: "transparent", borderRadius: 12, fontSize: 13, color: "#8b8f94", cursor: "pointer" }}>
          + Trainingsdag
        </button>
      </div>

      {day && (
        <>
          <DaySettings day={day} onPatch={patchDay} onRemove={removeDay} canRemove={days.length > 1} />
          {day.rowing && <RowingPanel day={day} onPatch={patchDay} />}
          <ExerciseTable day={day} savedMsg={savedMsg} flash={flash} onDayChanged={() => reload(dayId)} />
          <CopyToClientPanel day={day} clients={clients} currentClientId={client.id} flash={flash} />
        </>
      )}
    </>
  );
}

function DaySettings({ day, onPatch, onRemove, canRemove }) {
  const [title, setTitle] = useState(day.titel);
  useEffect(() => setTitle(day.titel), [day.id, day.titel]);

  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "20px 24px", marginTop: 16, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", marginBottom: 6 }}>Titel van deze trainingsdag</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== day.titel && onPatch({ titel: title })}
          style={{ width: "100%", height: 44, padding: "0 14px", border: "1.5px solid #e8ebee", borderRadius: 10, fontSize: 15, fontWeight: 600, color: "#000", outline: "none" }}
        />
      </div>
      <ToggleButton active={day.rotate} onClick={() => onPatch({ rotate: !day.rotate })} label="Rouleer core & mobiliteit uit de pool" />
      <ToggleButton active={day.rowing} onClick={() => onPatch({ rowing: !day.rowing })} label="Roeisessie met opbouw" />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        style={{ padding: "11px 18px", border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 12, fontSize: 13, color: "#8b8f94", cursor: canRemove ? "pointer" : "default", opacity: canRemove ? 1 : 0.4 }}
      >
        ✕ Dag verwijderen
      </button>
    </div>
  );
}

function ToggleButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: "#fff", textAlign: "left", border: "1.5px solid " + (active ? "#2c9dfd" : "#e8ebee") }}>
      <span style={{ flex: "none", width: 18, height: 18, borderRadius: 6, border: "1.5px solid " + (active ? "#2c9dfd" : "#c2c8cf"), background: active ? "#2c9dfd" : "#fff" }} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </button>
  );
}

function RowingPanel({ day, onPatch }) {
  const [base, setBase] = useState(day.rowBase);
  const [pct, setPct] = useState(day.rowPct);
  const [week, setWeek] = useState(day.rowWeek + 1);
  useEffect(() => {
    setBase(day.rowBase);
    setPct(day.rowPct);
    setWeek(day.rowWeek + 1);
  }, [day.id, day.rowBase, day.rowPct, day.rowWeek]);

  const now = rowMinutes(day.rowBase, day.rowPct, day.rowWeek);
  const next = rowMinutes(day.rowBase, day.rowPct, day.rowWeek, 1);
  const ladder = Array.from({ length: 8 }).map((_, i) => rowMinutes(day.rowBase, day.rowPct, i));
  const maxLadder = Math.max(...ladder);

  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", marginTop: 16, boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ maxWidth: "46ch" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Blok · roeiopbouw</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>
            De app rekent de roeitijd elke week zelf op. Startduur × (1 + %) per week.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <NumberField label="Startduur (min)" value={base} onChange={setBase} onBlur={() => onPatch({ rowBase: Number(base) || 1 })} />
            <NumberField label="Toename / week" value={pct} onChange={setPct} onBlur={() => onPatch({ rowPct: Number(pct) || 0 })} />
            <NumberField label="Huidige week" value={week} onChange={setWeek} onBlur={() => onPatch({ rowWeek: Math.max(0, (Number(week) || 1) - 1) })} />
          </div>
          <div style={{ fontSize: 13, color: "#7c8794", marginTop: 16 }}>
            Vandaag <strong style={{ color: "#000" }}>{now} min</strong> · volgende week {next} min
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", marginBottom: 14 }}>Opbouw over 8 weken (min)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 150 }}>
            {ladder.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#454e58" }}>{v}</div>
                <div style={{ width: "100%", borderRadius: "8px 8px 3px 3px", height: Math.round((v / maxLadder) * 88 + 12) + "%", background: i === day.rowWeek ? "linear-gradient(180deg,#2c9dfd,#1f5dc4)" : i < day.rowWeek ? "#dde3ea" : "#eef1f4" }} />
                <div style={{ fontSize: 11, color: "#8b8f94" }}>w{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, onBlur }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", marginBottom: 6 }}>{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} style={{ height: 40, width: 110, padding: "0 12px", border: "1.5px solid #e8ebee", borderRadius: 9, fontSize: 14, color: "#000", outline: "none" }} />
    </div>
  );
}

function ExerciseTable({ day, savedMsg, flash, onDayChanged }) {
  const [libOpen, setLibOpen] = useState(false);

  async function move(itemId, direction) {
    await api.moveItem(itemId, direction);
    onDayChanged();
  }
  async function drop(itemId) {
    await api.deleteItem(itemId);
    onDayChanged();
    flash("Oefening verwijderd");
  }
  async function patchItem(itemId, patch) {
    await api.updateItem(itemId, patch);
    onDayChanged();
  }
  async function reroll() {
    await api.rerollPool(day.id);
    flash("Nieuwe selectie actief");
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", marginTop: 16, boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>{day.titel}</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Pas sets, herhalingen, doelgewicht en rust aan — wijzigingen staan direct in de app van deze klant.</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#1f5dc4", fontWeight: 600 }}>{savedMsg}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "34px 1.4fr .8fr .45fr .6fr .8fr .5fr 1fr 40px", gap: 10, marginTop: 20, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", paddingBottom: 10, borderBottom: "1px solid #e8ebee" }}>
        <div /><div>Oefening</div><div>Blok</div><div>Sets</div><div>Herh. / tijd</div><div>Doelgewicht</div><div>Rust</div><div>Videolink</div><div />
      </div>

      {day.items.length === 0 && <div style={{ padding: "16px 0", color: "#c2c8cf", fontSize: 13.5 }}>Nog geen oefeningen in deze training.</div>}

      {day.items.map((item, i) => (
        <ItemRow key={item.id} item={item} isFirst={i === 0} isLast={i === day.items.length - 1} onMove={move} onDrop={drop} onPatch={patchItem} />
      ))}

      <QuickAdd dayId={day.id} onAdded={onDayChanged} />
      <LibraryPanel open={libOpen} setOpen={setLibOpen} dayId={day.id} onAdded={onDayChanged} />

      {day.rotate && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 18, borderTop: "1px solid #e8ebee" }}>
          <Button variant="primary" size="md" onClick={reroll} style={{ whiteSpace: "nowrap" }}>
            Rouleer pool
          </Button>
          <div style={{ fontSize: 12.5, color: "#7c8794" }}>
            Voor dagen met rotatie kiest de app elke week 3 mobiliteitsoefeningen (warming up) en 3 core-oefeningen (cooldown) uit de pool. Hiermee forceer je een nieuwe selectie.
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, isFirst, isLast, onMove, onDrop, onPatch }) {
  const [local, setLocal] = useState(item);
  useEffect(() => setLocal(item), [item]);
  const unit = local.unit || (local.type === "time" && !local.doelgewicht ? "sec" : "kg");
  const isBw = unit !== "kg" && !local.doelgewicht;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "34px 1.4fr .8fr .45fr .6fr .8fr .5fr 1fr 40px", gap: 10, padding: "12px 0", borderBottom: "1px solid #f4f6f8", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
        <button onClick={() => onMove(item.id, -1)} disabled={isFirst} title="Omhoog" style={moveBtnStyle(isFirst)}>▲</button>
        <button onClick={() => onMove(item.id, 1)} disabled={isLast} title="Omlaag" style={moveBtnStyle(isLast)}>▼</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ flex: "none", width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Exo,sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 12, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)", color: "#fff" }}>
          {BLOCK_TAG[local.block]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{local.naam}</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94" }}>vaste oefening</div>
        </div>
      </div>
      <select value={local.block} onChange={(e) => { setLocal({ ...local, block: e.target.value }); onPatch(item.id, { block: e.target.value }); }} style={selectStyle}>
        {BLOCK_OPTIONS.map((b) => (
          <option key={b.value} value={b.value}>{b.label}</option>
        ))}
      </select>
      <input type="number" value={local.sets} onChange={(e) => setLocal({ ...local, sets: e.target.value })} onBlur={() => onPatch(item.id, { sets: Number(local.sets) || 1 })} style={cellInputStyle} />
      <input type="number" value={local.repsOfSec} onChange={(e) => setLocal({ ...local, repsOfSec: e.target.value })} onBlur={() => onPatch(item.id, { repsOfSec: Number(local.repsOfSec) || 1 })} style={cellInputStyle} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isBw ? (
          <span style={{ fontSize: 12.5, color: "#c2c8cf" }}>lichaamsgewicht</span>
        ) : (
          <>
            <input type="number" step="2.5" value={local.doelgewicht} onChange={(e) => setLocal({ ...local, doelgewicht: e.target.value })} onBlur={() => onPatch(item.id, { doelgewicht: Number(local.doelgewicht) || 0 })} style={cellInputStyle} />
            <span style={{ fontSize: 12, color: "#8b8f94", flex: "none" }}>kg</span>
          </>
        )}
      </div>
      <input type="number" step="15" value={local.restSec} onChange={(e) => setLocal({ ...local, restSec: e.target.value })} onBlur={() => onPatch(item.id, { restSec: Number(local.restSec) || 0 })} style={cellInputStyle} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <input
          type="text"
          value={local.videoUrl || ""}
          onChange={(e) => setLocal({ ...local, videoUrl: e.target.value })}
          onBlur={() => onPatch(item.id, { videoUrl: local.videoUrl || null })}
          placeholder="https://…"
          style={{ height: 38, padding: "0 10px", border: "1.5px solid #e8ebee", borderRadius: 9, fontSize: 12.5, color: "#454e58", outline: "none", width: "100%", minWidth: 0 }}
        />
        {local.videoUrl && (
          <a href={local.videoUrl} target="_blank" rel="noreferrer" style={{ flex: "none", width: 34, height: 34, borderRadius: 9, background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#1f5dc4", textDecoration: "none" }}>▶</a>
        )}
      </div>
      <button onClick={() => onDrop(item.id)} title="Oefening verwijderen" style={{ width: 34, height: 38, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 9, fontSize: 14, color: "#c2c8cf", cursor: "pointer" }}>✕</button>
    </div>
  );
}

function moveBtnStyle(disabled) {
  return { width: 26, height: 18, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 6, fontSize: 10, lineHeight: 1, color: "#8b8f94", cursor: disabled ? "default" : "pointer", padding: 0, opacity: disabled ? 0.3 : 1 };
}
const selectStyle = { height: 38, padding: "0 8px", border: "1.5px solid #e8ebee", borderRadius: 9, fontSize: 13, color: "#000", background: "#fff", outline: "none", width: "100%" };
const cellInputStyle = { height: 38, padding: "0 10px", border: "1.5px solid #e8ebee", borderRadius: 9, fontSize: 14, color: "#000", outline: "none", width: "100%" };

function QuickAdd({ dayId, onAdded }) {
  const [naam, setNaam] = useState("Bench press");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!naam.trim()) return;
    setBusy(true);
    try {
      await api.addItem(dayId, { naam, block: "main", sets: 3, repsOfSec: 10, doelgewicht: 0, restSec: 90, type: "reps", bron: "eigen" });
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 18, borderTop: "1px solid #e8ebee", flexWrap: "wrap" }}>
      <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", width: "100%" }}>Snel toevoegen · eigen oefening</div>
      <input value={naam} onChange={(e) => setNaam(e.target.value)} style={{ height: 44, minWidth: 260, padding: "0 12px", border: "1.5px solid #e8ebee", borderRadius: 10, fontSize: 14, color: "#000", outline: "none" }} placeholder="Naam van de oefening" />
      <Button variant="dark" size="md" onClick={add} disabled={busy}>+ Toevoegen aan deze training</Button>
      <div style={{ fontSize: 12.5, color: "#8b8f94", flex: 1, minWidth: 220 }}>Start met 3 sets en de standaardwaarden — daarna pas je sets, herhalingen, gewicht en rust in de rij aan.</div>
    </div>
  );
}

function CopyToClientPanel({ day, clients, currentClientId, flash }) {
  const [busyId, setBusyId] = useState(null);
  const others = (clients || []).filter((c) => c.id !== currentClientId);

  async function copyTo(target) {
    setBusyId(target.id);
    try {
      await api.copyDayToClient(day.id, target.id);
      flash(`“${day.titel}” gekopieerd naar ${target.naam}`);
    } finally {
      setBusyId(null);
    }
  }

  if (!others.length) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", marginTop: 16, boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
      <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Kopiëren naar een andere klant</div>
      <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Zet “{day.titel}” — met alle oefeningen — als nieuwe trainingsdag bij een andere klant.</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {others.map((c) => (
          <button
            key={c.id}
            onClick={() => copyTo(c)}
            disabled={busyId === c.id}
            style={{ padding: "10px 16px", border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 999, fontSize: 13, color: "#454e58", cursor: busyId === c.id ? "default" : "pointer" }}
          >
            {busyId === c.id ? "Bezig…" : `→ ${c.naam}`}
          </button>
        ))}
      </div>
    </div>
  );
}

function LibraryPanel({ open, setOpen, dayId, onAdded }) {
  const [muscles, setMuscles] = useState([]);
  const [goal, setGoal] = useState("all");
  const [muscle, setMuscle] = useState("all");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (open && muscles.length === 0) api.libraryMuscles().then(setMuscles);
  }, [open, muscles.length]);

  useEffect(() => {
    if (!open) return;
    api.library({ goal, muscle, q }).then((r) => setResults(r.items));
  }, [open, goal, muscle, q]);

  async function addLib(item) {
    const timed = item.doel === "mobility" || item.doel === "stability";
    await api.addItem(dayId, {
      naam: item.naam,
      block: goalBlock(item.doel),
      type: timed ? "time" : "reps",
      sets: item.doel === "mobility" ? 2 : 3,
      repsOfSec: timed ? (item.doel === "mobility" ? 45 : 30) : item.doel === "core" ? 12 : 10,
      doelgewicht: 0,
      restSec: item.doel === "mobility" ? 20 : item.doel === "stability" || item.doel === "core" ? 30 : 90,
      bron: item.bron,
    });
    onAdded();
  }

  return (
    <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #e8ebee" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Oefeningenbibliotheek</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Gecureerde bibliotheek, seed uit open bronnen. Filter op doel en op primaire spiergroep.</div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ padding: "10px 16px", border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 999, fontSize: 13, color: "#454e58", cursor: "pointer" }}>
          {open ? "Verbergen" : "Bibliotheek tonen"}
        </button>
      </div>

      {open && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => setGoal(g.id)} style={{ padding: "8px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid " + (goal === g.id ? "#000" : "#e8ebee"), background: goal === g.id ? "#000" : "#fff", color: goal === g.id ? "#fff" : "#7c8794" }}>
                {g.nl}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={() => setMuscle("all")} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "1.5px solid " + (muscle === "all" ? "#2c9dfd" : "#e8ebee"), background: muscle === "all" ? "rgba(44,157,253,.1)" : "#fff", color: muscle === "all" ? "#1f5dc4" : "#8b8f94" }}>
              Alle spiergroepen
            </button>
            {muscles.map((m) => (
              <button key={m} onClick={() => setMuscle(m)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "1.5px solid " + (muscle === m ? "#2c9dfd" : "#e8ebee"), background: muscle === m ? "rgba(44,157,253,.1)" : "#fff", color: muscle === m ? "#1f5dc4" : "#8b8f94" }}>
                {m}
              </button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op naam of materiaal" style={{ width: "100%", height: 44, marginTop: 14, padding: "0 14px", border: "1.5px solid #e8ebee", borderRadius: 10, fontSize: 14, color: "#000", outline: "none" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 14 }}>
            {results.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "1px solid #e8ebee", borderRadius: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#000" }}>{item.naam}</div>
                  <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 2 }}>{item.primaireSpier} · {item.materiaal}</div>
                </div>
                <button onClick={() => addLib(item)} style={{ flex: "none", height: 36, padding: "0 14px", border: "1.5px solid #2c9dfd", background: "rgba(44,157,253,.08)", color: "#1f5dc4", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  + Voeg toe
                </button>
              </div>
            ))}
          </div>
          {results.length === 0 && <div style={{ marginTop: 12, fontSize: 12.5, color: "#8b8f94" }}>Geen resultaten.</div>}
        </>
      )}
    </div>
  );
}
