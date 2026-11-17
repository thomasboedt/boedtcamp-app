import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import TrendChart, { CHART_METRICS, fmt, measurementPoints, shortDate, zone, zoneColor } from "./TrendChart.jsx";

const RANGES = [
  { key: 10, label: "10" },
  { key: 30, label: "30" },
  { key: 0, label: "Alles" },
];

export default function Progress({ onBack }) {
  const [tab, setTab] = useState("kracht");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onBack} aria-label="Terug" style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Mijn progressie</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94" }}>{tab === "kracht" ? "Gewicht per oefening" : "Metingen doorheen de tijd"}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 28px", background: "#f4f6f8" }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: "kracht", label: "Kracht" },
            { key: "gezondheid", label: "Gezondheid" },
          ]}
        />
        <div style={{ marginTop: 14 }}>{tab === "kracht" ? <Strength /> : <Health />}</div>
      </div>
    </div>
  );
}

function Strength() {
  const [exercises, setExercises] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(10);

  useEffect(() => {
    api
      .strengthExercises()
      .then((names) => {
        setExercises(names);
        setExercise(names[0] || null);
      })
      .catch(() => setExercises([]));
  }, []);

  useEffect(() => {
    if (!exercise) {
      setRows([]);
      return;
    }
    let active = true;
    api.strengthProgress(exercise).then((res) => active && setRows(res.rows || []));
    return () => {
      active = false;
    };
  }, [exercise]);

  if (exercises === null) return <Muted text="Laden…" />;

  const sorted = [...exercises].sort((a, b) => a.localeCompare(b, "nl"));
  const all = rows.map((r) => ({ id: r.id, iso: r.dateIso, val: r.val, reps: r.reps }));
  const points = range ? all.slice(-range) : all;
  const best = all.length ? all.reduce((a, b) => (b.val > a.val ? b : a)) : null;
  const first = all[0];
  const last = all[all.length - 1];

  return (
    <>
      <TrendChart
        eyebrow="Kracht"
        options={sorted.map((n) => ({ key: n, label: n }))}
        value={exercise}
        onChange={setExercise}
        points={points}
        unit="kg"
        decimals={undefined}
        subLabel={last?.reps ? `zwaarste set laatste training: ${last.reps} herhalingen` : undefined}
        emptyText={exercises.length ? "Nog geen gewichten voor deze oefening." : "Nog geen oefeningen met gewicht geregistreerd. Voltooi een training om je progressie te zien."}
        footnote="Zwaarste set per afgeronde training."
      />
      {all.length > 0 && <RangePicker value={range} onChange={setRange} />}
      {all.length > 0 && (
        <StatRow
          stats={[
            { label: "Eerste", value: `${fmt(first.val)} kg`, sub: shortDate(first.iso) },
            { label: "Record", value: `${fmt(best.val)} kg`, sub: shortDate(best.iso), accent: true },
            { label: "Verschil", value: signed(last.val - first.val, undefined, "kg"), sub: `${all.length} trainingen` },
          ]}
        />
      )}
    </>
  );
}

function Health() {
  const [history, setHistory] = useState(null);
  const [metricKey, setMetricKey] = useState("weight");
  const [range, setRange] = useState(10);

  useEffect(() => {
    api
      .measurementHistory()
      .then((res) => setHistory(res.rows || []))
      .catch(() => setHistory([]));
  }, []);

  if (history === null) return <Muted text="Laden…" />;

  const metric = CHART_METRICS.find((m) => m.key === metricKey);
  const all = measurementPoints(history, metricKey);
  const points = range ? all.slice(-range) : all;
  const first = all[0];
  const last = all[all.length - 1];
  const z = last && ["bmi", "whr", "whtr"].includes(metricKey) ? zone(metricKey, last.val) : null;
  const unit = metric.unit ? ` ${metric.unit}` : "";

  return (
    <>
      <TrendChart
        eyebrow="Gezondheid"
        options={CHART_METRICS}
        value={metricKey}
        onChange={setMetricKey}
        points={points}
        unit={metric.unit}
        decimals={metric.decimals}
        valueColor={z && z.color !== "neutral" ? zoneColor[z.color] : undefined}
        subLabel={z?.label}
        emptyText={`Nog geen metingen voor ${metric.label.toLowerCase()}.`}
        footnote="BMI en verhoudingen worden automatisch berekend."
      />
      {all.length > 0 && <RangePicker value={range} onChange={setRange} />}
      {all.length > 0 && (
        <StatRow
          stats={[
            { label: "Eerste", value: fmt(first.val, metric.decimals) + unit, sub: shortDate(first.iso) },
            { label: "Laatste", value: fmt(last.val, metric.decimals) + unit, sub: shortDate(last.iso), accent: true },
            { label: "Verschil", value: signed(last.val - first.val, metric.decimals, metric.unit), sub: `${all.length} metingen` },
          ]}
        />
      )}
    </>
  );
}

function signed(diff, decimals, unit) {
  const u = unit ? ` ${unit}` : "";
  if (diff === 0) return `0${u}`;
  return `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff), decimals)}${u}`;
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 4, background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 14 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              flex: 1,
              height: 40,
              border: 0,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              background: active ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "transparent",
              color: active ? "#fff" : "#454e58",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RangePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 10 }}>
      <span style={{ fontSize: 11.5, color: "#8b8f94", marginRight: 2 }}>Toon laatste</span>
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            style={{
              padding: "5px 11px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "1.5px solid " + (active ? "#1f5dc4" : "#e8ebee"),
              background: active ? "#1f5dc4" : "#fff",
              color: active ? "#fff" : "#454e58",
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

function StatRow({ stats }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 14, padding: "12px 12px" }}>
          <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>{s.label}</div>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 18, marginTop: 5, color: s.accent ? "#1f5dc4" : "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.value}
          </div>
          <div style={{ fontSize: 10.5, color: "#8b8f94", marginTop: 2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Muted({ text }) {
  return <div style={{ padding: "30px 0", textAlign: "center", color: "#8b8f94", fontSize: 13 }}>{text}</div>;
}
