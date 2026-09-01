import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { segLight } from "../../lib/styles.js";

const CHART_TABS = [
  { key: "weight", label: "Gewicht" },
  { key: "fat", label: "Vet %" },
  { key: "muscle", label: "Spiermassa" },
  { key: "waist", label: "Middel" },
  { key: "bmi", label: "BMI" },
];

const zoneColor = { green: "#2f9e63", orange: "#d8862a", red: "#c9463c", neutral: "#7c8794" };

export default function Measurements({ clientId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [chartKey, setChartKey] = useState("weight");

  useEffect(() => {
    setLoading(true);
    api.clientMeasurements(clientId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return <div style={{ marginTop: 24, color: "#8b8f94" }}>Laden…</div>;
  if (!data || !data.latestDate) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", marginTop: 24, boxShadow: "0 1px 2px rgba(10,14,20,.05)", color: "#8b8f94", fontSize: 13.5 }}>
        Deze klant registreerde nog geen metingen.
      </div>
    );
  }

  const series = data.series[chartKey] || [];
  const vals = series.map((s) => s.val);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const range = max - min || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 26 }}>
      <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Laatste meting</div>
        <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>
          {data.latestDate} · {data.seriesCount} metingen in de laatste 30 dagen
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 18 }}>
          {data.kpis.map((k) => (
            <div key={k.label} style={{ background: "#f4f6f8", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>{k.label}</div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 20, color: "#000", marginTop: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Verloop</div>
              <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Laatste 30 dagen</div>
            </div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "#f4f6f8", borderRadius: 999, flexWrap: "wrap" }}>
              {CHART_TABS.map((t) => (
                <button key={t.key} onClick={() => setChartKey(t.key)} style={segLight(chartKey === t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 190, marginTop: 22 }}>
            {series.length === 0 && <div style={{ fontSize: 12.5, color: "#c2c8cf", alignSelf: "center" }}>Geen gegevens voor deze metriek.</div>}
            {series.map((s, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div
                  style={{
                    width: "100%",
                    borderRadius: "6px 6px 2px 2px",
                    height: Math.round(((s.val - min) / range) * 80 + 12) + "%",
                    background: i === series.length - 1 ? "linear-gradient(180deg,#2c9dfd,#1f5dc4)" : "#dde3ea",
                  }}
                />
                <div style={{ fontSize: 9.5, color: "#8b8f94" }}>{series.length > 15 && i % 4 !== 0 ? "" : s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Hoe het voelt</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Gemiddelde score over 30 dagen</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
            {data.feel.map((f) => (
              <div key={f.key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#454e58" }}>
                  <span>{f.label}</span>
                  <span style={{ fontWeight: 600, color: "#000" }}>{f.value}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "#f4f6f8", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${f.value === "—" ? 0 : (f.value / 10) * 100}%`, background: "linear-gradient(90deg,#2c9dfd,#1f5dc4)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Alle metingen</div>
        <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Stress / slaap / energie op 10 · laatste 14 registraties</div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 880 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr .7fr .6fr .7fr .8fr .7fr .7fr .6fr .7fr .8fr 1fr",
                columnGap: 14,
                rowGap: 0,
                marginTop: 16,
                fontSize: 10.5,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#8b8f94",
                paddingBottom: 10,
                borderBottom: "1px solid #e8ebee",
              }}
            >
              <div>Datum</div>
              <div>Gewicht</div>
              <div>Vet %</div>
              <div>Spier</div>
              <div>Vocht %</div>
              <div>Visc.</div>
              <div>Middel</div>
              <div>Heup</div>
              <div>BMI</div>
              <div>M/H · M/L</div>
              <div>Str/Sl/En</div>
            </div>
            {data.rows.map((r) => (
              <div
                key={r.dateIso}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr .7fr .6fr .7fr .8fr .7fr .7fr .6fr .7fr .8fr 1fr",
                  columnGap: 14,
                  rowGap: 0,
                  padding: "11px 0",
                  borderBottom: "1px solid #f4f6f8",
                  alignItems: "center",
                  fontSize: 13,
                  color: "#7c8794",
                }}
              >
                <div style={{ color: "#000", fontWeight: 600 }}>{r.dateLabel}</div>
                <div>{r.weight}</div>
                <div>{r.fat}</div>
                <div>{r.muscle}</div>
                <div>{r.water}</div>
                <div>{r.visceral}</div>
                <div>{r.waist}</div>
                <div>{r.hip}</div>
                <div style={{ fontWeight: 600, color: zoneColor[r.bmiZone] }}>{r.bmi}</div>
                <div>
                  <span style={{ fontWeight: 600, color: zoneColor[r.whrZone] }}>{r.whr}</span> · <span style={{ fontWeight: 600, color: zoneColor[r.whtrZone] }}>{r.whtr}</span>
                </div>
                <div>{r.feel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
