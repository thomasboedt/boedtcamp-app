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

  const maxBar = Math.max(1, ...chartData.map((b) => b.val));
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
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {chartExercises.map((name) => (
                <button
                  key={name}
                  onClick={() => setChartName(name)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1.5px solid " + (chartName === name ? "#2c9dfd" : "#e8ebee"),
                    background: chartName === name ? "rgba(44,157,253,.1)" : "#fff",
                    color: chartName === name ? "#1f5dc4" : "#8b8f94",
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 210, marginTop: 24, paddingBottom: 2 }}>
            {chartData.length === 0 && <div style={{ color: "#c2c8cf", fontSize: 13 }}>Nog geen geschiedenis voor deze oefening.</div>}
            {chartData.map((b, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#454e58" }}>{fmt(b.val)}</div>
                <div
                  style={{
                    width: "100%",
                    borderRadius: "8px 8px 3px 3px",
                    height: Math.round((b.val / maxBar) * 100 * 0.78 + 12) + "%",
                    background: i === chartData.length - 1 ? "linear-gradient(180deg,#2c9dfd,#1f5dc4)" : "#dde3ea",
                  }}
                />
                <div style={{ fontSize: 11, color: "#8b8f94" }}>{b.label}</div>
              </div>
            ))}
          </div>
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
