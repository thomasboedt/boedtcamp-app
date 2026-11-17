import { useId } from "react";

// Shared measurement definitions, used by both "Metingen bijhouden" and
// "Progressie · Gezondheid".
export const BODY_FIELDS = [
  { key: "weight", label: "Gewicht", unit: "kg", step: 0.1 },
  { key: "height", label: "Lengte", unit: "cm", step: 1 },
  { key: "fat", label: "Vetpercentage", unit: "%", step: 0.1 },
  { key: "muscle", label: "Spiermassa", unit: "kg", step: 0.1 },
  { key: "water", label: "Lichaamsvocht", unit: "%", step: 0.1 },
  { key: "visceral", label: "Visceraal vet", unit: "niveau", step: 1 },
];
export const GIRTH_FIELDS = [
  { key: "waist", label: "Omtrek middel", unit: "cm", step: 0.5 },
  { key: "hip", label: "Omtrek heup", unit: "cm", step: 0.5 },
];
export const SCORE_FIELDS = [
  { key: "stress", label: "Stress", low: "geen stress", high: "heel gespannen" },
  { key: "sleep", label: "Slaapgevoel", low: "slecht geslapen", high: "uitgerust" },
  { key: "energy", label: "Energieniveau", low: "uitgeput", high: "vol energie" },
];
export const CHART_METRICS = [
  ...BODY_FIELDS,
  ...GIRTH_FIELDS,
  { key: "bmi", label: "BMI", unit: "", decimals: 1 },
  { key: "whr", label: "Middel / heup", unit: "", decimals: 2 },
  { key: "whtr", label: "Middel / lengte", unit: "", decimals: 2 },
  ...SCORE_FIELDS.map((f) => ({ ...f, unit: "/ 10" })),
];

export const zoneColor = { green: "#2f9e63", orange: "#d8862a", red: "#c9463c", neutral: "#8b8f94" };

export function zone(metric, v) {
  if (!v) return { color: "neutral", label: "" };
  if (metric === "bmi") {
    if (v < 18.5) return { color: "orange", label: "ondergewicht" };
    if (v < 25) return { color: "green", label: "gezond gewicht" };
    if (v < 30) return { color: "orange", label: "overgewicht" };
    return { color: "red", label: "obesitas" };
  }
  if (metric === "whr") {
    if (v < 0.9) return { color: "green", label: "onder 0,90" };
    if (v <= 0.95) return { color: "orange", label: "0,90 – 0,95" };
    return { color: "red", label: "boven 0,95" };
  }
  if (v < 0.4) return { color: "orange", label: "onder 0,40" };
  if (v < 0.5) return { color: "green", label: "0,40 – 0,49" };
  if (v < 0.6) return { color: "orange", label: "0,50 – 0,59" };
  return { color: "red", label: "boven 0,59" };
}

export function fmt(v, decimals) {
  const d = decimals ?? (Number.isInteger(v) ? 0 : 1);
  return v.toFixed(d).replace(".", ",");
}

export function shortDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("nl-BE", { day: "numeric", month: "short" }).replace(".", "");
}

// Points for one measurement metric from the history rows (oldest first).
export function measurementPoints(history, metricKey, limit) {
  const pts = history
    .filter((r) => r[metricKey] !== null && r[metricKey] !== undefined && r[metricKey] !== 0)
    .map((r) => ({ id: r.dateIso, iso: r.dateIso, val: r[metricKey] }));
  return limit ? pts.slice(-limit) : pts;
}

// Dark card with a dropdown and an SVG line chart. Generic: callers pass the
// dropdown options, the points ({ id, iso, val }) and how to format values.
export default function TrendChart({
  eyebrow = "Verloop",
  options,
  value,
  onChange,
  points,
  unit,
  decimals,
  valueColor,
  subLabel,
  emptyText,
  footnote,
  diffLabel = "t.o.v. vorige",
}) {
  const gradId = useId().replace(/:/g, "");
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const diff = last && prev ? last.val - prev.val : null;

  const W = 320;
  const H = 150;
  const padX = 18;
  const padTop = 22;
  const padBottom = 24;
  const vals = points.map((p) => p.val);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const range = max - min || 1;
  const x = (i) => (points.length === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (points.length - 1));
  const y = (v) => (max === min ? (padTop + H - padBottom) / 2 : padTop + ((max - v) / range) * (H - padTop - padBottom));
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.val).toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${line} L${x(points.length - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z` : "";
  // Thin out labels so they never overlap: at most ~5-6 labels, always the last.
  const step = points.length <= 5 ? 1 : Math.ceil(points.length / 5);

  return (
    <div style={{ background: "#000", borderRadius: 16, padding: "16px 16px 12px", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: "none", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#2c9dfd" }}>{eyebrow}</div>
        {options.length > 0 && (
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{ minWidth: 0, maxWidth: "70%", background: "#16191d", color: "#fff", border: "1px solid #2a2f35", borderRadius: 10, padding: "7px 10px", fontSize: 13, fontWeight: 600, outline: "none", cursor: "pointer" }}
          >
            {options.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, minHeight: 30, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 24, color: valueColor || "#fff" }}>
          {last ? fmt(last.val, decimals) : "—"}
        </div>
        {last && unit && <div style={{ fontSize: 12, color: "#8b8f94" }}>{unit}</div>}
        {diff !== null && diff !== 0 && (
          <div style={{ fontSize: 12, color: "#8b8f94" }}>
            {diff > 0 ? "▲ +" : "▼ "}
            {fmt(diff, decimals)} {diffLabel}
          </div>
        )}
      </div>
      {subLabel && <div style={{ fontSize: 11, color: "#8b8f94" }}>{subLabel}</div>}

      {points.length === 0 ? (
        <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, color: "#8b8f94", textAlign: "center", padding: "0 12px" }}>
          {emptyText}
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginTop: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c9dfd" stopOpacity=".35" />
              <stop offset="100%" stopColor="#2c9dfd" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={padX} x2={W - padX} y1={H - padBottom} y2={H - padBottom} stroke="#2a2f35" strokeWidth="1" />
          {area && <path d={area} fill={`url(#${gradId})`} />}
          {points.length > 1 && <path d={line} fill="none" stroke="#2c9dfd" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const showLabel = isLast || (points.length - 1 - i) % step === 0;
            const r = points.length > 20 ? 2.5 : 3.5;
            return (
              <g key={p.id}>
                <circle cx={x(i)} cy={y(p.val)} r={isLast ? 5 : r} fill={isLast ? "#2c9dfd" : "#000"} stroke="#2c9dfd" strokeWidth="2" />
                {showLabel && (
                  <text x={x(i)} y={y(p.val) - 9} textAnchor="middle" fontSize="10" fontWeight="600" fill={isLast ? "#fff" : "#8b8f94"}>
                    {fmt(p.val, decimals)}
                  </text>
                )}
                {showLabel && (
                  <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#8b8f94">
                    {shortDate(p.iso)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {footnote && <div style={{ fontSize: 11, color: "#8b8f94", marginTop: 4 }}>{footnote}</div>}
    </div>
  );
}
