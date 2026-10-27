import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import Card from "../../ds/Card.jsx";
import { fmt } from "../../lib/styles.js";

export default function Opvolging({ clientId }) {
  const [dashboard, setDashboard] = useState(null);
  const [chartExercises, setChartExercises] = useState([]);
  const [chartName, setChartName] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const [dash, names] = await Promise.all([api.dashboard(clientId), api.chartExercises(clientId)]);
      setDashboard(dash);
      setChartExercises(names);
      setChartName(names[0] || null);
      setLoading(false);
    })();
  }, [clientId]);

  useEffect(() => {
    if (!chartName) {
      setChartData([]);
      return;
    }
    api.progress(clientId, chartName).then(setChartData);
  }, [clientId, chartName]);

  if (loading || !dashboard) return <div style={{ marginTop: 26, color: "#8b8f94" }}>Laden…</div>;

  const sortedExercises = [...chartExercises].sort((a, b) => a.localeCompare(b, "nl"));
  const maxVol = Math.max(1, ...dashboard.volumeRows.map((v) => v.val));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 26 }}>
        {dashboard.kpis.map((k) => (
          <Card key={k.label} style={{ padding: "18px 20px", borderRadius: 14, height: "100%" }}>
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{k.label}</div>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 30, color: "#000", marginTop: 8, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#8b8f94", marginTop: 6 }}>{k.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 18, marginTop: 18, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Gewichtsprogressie</div>
              <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Zwaarste set per sessie</div>
            </div>
            {chartExercises.length > 0 && (
              <select
                value={chartName || ""}
                onChange={(e) => setChartName(e.target.value)}
                aria-label="Kies een oefening"
                style={{ maxWidth: 260, background: "#fff", color: "#000", border: "1.5px solid #e8ebee", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, outline: "none", cursor: "pointer" }}
              >
                {sortedExercises.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <ProgressLineChart data={chartData} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Volume per training</div>
            <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Totaal getild gewicht (ton)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
              {dashboard.volumeRows.length === 0 && <div style={{ color: "#c2c8cf", fontSize: 13 }}>Nog geen sessies.</div>}
              {dashboard.volumeRows.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 64, flex: "none", fontSize: 12, color: "#8b8f94" }}>{v.label}</div>
                  <div style={{ flex: 1, height: 12, borderRadius: 999, background: "#f4f6f8", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, width: Math.round((v.val / maxVol) * 100) + "%", background: i === dashboard.volumeRows.length - 1 ? "linear-gradient(90deg,#2c9dfd,#1f5dc4)" : "#dde3ea" }} />
                  </div>
                  <div style={{ width: 52, flex: "none", textAlign: "right", fontSize: 12.5, fontWeight: 600, color: "#454e58" }}>{fmt(v.val)} t</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#000 url(/background-dark-chevron.png) right top/cover no-repeat", color: "#fff", borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19 }}>Opmerkingen &amp; pijn</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              {dashboard.notes.length === 0 && <div style={{ color: "#8b8f94", fontSize: 13 }}>Nog geen opmerkingen.</div>}
              {dashboard.notes.map((n, i) => (
                <div key={i} style={{ borderLeft: "2px solid rgba(255,255,255,.14)", paddingLeft: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11.5, color: "#8b8f94" }}>{n.when} · {n.day}</div>
                    {n.pain && (
                      <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "rgba(255,120,110,.16)", color: "#ff8b82" }}>
                        pijn
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#e8ebee", marginTop: 4 }}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", marginTop: 18, boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Laatste sessie in detail</div>
        <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>{dashboard.lastSessionMeta}</div>
        {dashboard.sessionRows.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr .8fr .8fr .9fr", marginTop: 18, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", paddingBottom: 10, borderBottom: "1px solid #e8ebee" }}>
              <div>Oefening</div><div>Sets×Reps</div><div>Vorige</div><div>Uitgevoerd</div><div>Verschil</div>
            </div>
            {dashboard.sessionRows.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr .8fr .8fr .9fr", padding: "12px 0", borderBottom: "1px solid #f4f6f8", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{r.name}</div>
                <div style={{ fontSize: 13.5, color: "#7c8794" }}>{r.target}</div>
                <div style={{ fontSize: 13.5, color: "#c2c8cf" }}>{r.prev}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{r.actual}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: r.delta.startsWith("+") ? "#1f5dc4" : r.delta.startsWith("−") ? "#c9463c" : "#c2c8cf" }}>{r.delta}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

// Line chart of the heaviest set per session for the selected exercise.
function ProgressLineChart({ data }) {
  if (data.length === 0) {
    return <div style={{ height: 210, marginTop: 24, display: "flex", alignItems: "center", color: "#c2c8cf", fontSize: 13 }}>Nog geen geschiedenis voor deze oefening.</div>;
  }

  const W = 560;
  const H = 220;
  const padX = 28;
  const padTop = 28;
  const padBottom = 30;
  const vals = data.map((p) => p.val);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i) => (data.length === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (data.length - 1));
  const y = (v) => (max === min ? (padTop + H - padBottom) / 2 : padTop + ((max - v) / range) * (H - padTop - padBottom));
  const line = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.val).toFixed(1)}`).join(" ");
  const area = data.length > 1 ? `${line} L${x(data.length - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z` : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginTop: 18 }}>
      <defs>
        <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c9dfd" stopOpacity=".22" />
          <stop offset="100%" stopColor="#2c9dfd" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padX} x2={W - padX} y1={H - padBottom} y2={H - padBottom} stroke="#e8ebee" strokeWidth="1" />
      {area && <path d={area} fill="url(#progressFill)" />}
      {data.length > 1 && <path d={line} fill="none" stroke="#2c9dfd" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {data.map((p, i) => {
        const isLast = i === data.length - 1;
        const showLabel = isLast || data.length <= 8 || i % 2 === (data.length - 1) % 2;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.val)} r={isLast ? 5.5 : 4} fill={isLast ? "#2c9dfd" : "#fff"} stroke="#2c9dfd" strokeWidth="2" />
            {showLabel && (
              <text x={x(i)} y={y(p.val) - 11} textAnchor="middle" fontSize="12" fontWeight="600" fill={isLast ? "#000" : "#454e58"}>
                {fmt(p.val)}
              </text>
            )}
            {showLabel && (
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#8b8f94">
                {p.date || p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
