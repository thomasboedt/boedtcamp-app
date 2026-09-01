import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { isoAdd, isoToday } from "./food/foodShared.js";

const BODY_FIELDS = [
  { key: "weight", label: "Gewicht", unit: "kg", step: 0.1 },
  { key: "height", label: "Lengte", unit: "cm", step: 1 },
  { key: "fat", label: "Vetpercentage", unit: "%", step: 0.1 },
  { key: "muscle", label: "Spiermassa", unit: "kg", step: 0.1 },
  { key: "water", label: "Lichaamsvocht", unit: "%", step: 0.1 },
  { key: "visceral", label: "Visceraal vet", unit: "niveau", step: 1 },
];
const GIRTH_FIELDS = [
  { key: "waist", label: "Omtrek middel", unit: "cm", step: 0.5 },
  { key: "hip", label: "Omtrek heup", unit: "cm", step: 0.5 },
];
const SCORE_FIELDS = [
  { key: "stress", label: "Stress", low: "geen stress", high: "heel gespannen" },
  { key: "sleep", label: "Slaapgevoel", low: "slecht geslapen", high: "uitgerust" },
  { key: "energy", label: "Energieniveau", low: "uitgeput", high: "vol energie" },
];

const zoneColor = { green: "#2f9e63", orange: "#d8862a", red: "#c9463c", neutral: "#8b8f94" };

function zone(metric, v) {
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

function nlDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}

export default function Measurements({ onBack }) {
  const [date, setDate] = useState(isoToday());
  const [form, setForm] = useState({});
  const [calc, setCalc] = useState({ bmi: 0, whr: 0, whtr: 0 });
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    let active = true;
    api.measurementDay(date).then((res) => {
      if (!active) return;
      if (res.measurement) {
        setForm(res.measurement);
        setCalc(res.calc);
      } else {
        setForm(res.fallbackHeight ? { height: res.fallbackHeight } : {});
        setCalc(res.calc);
      }
    });
    return () => {
      active = false;
    };
  }, [date]);

  function flash() {
    setSavedMsg("Meting opgeslagen");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function save(field, rawValue) {
    const value = rawValue === "" ? null : Number(rawValue);
    setForm((f) => ({ ...f, [field]: value }));
    if (value === null || Number.isNaN(value)) return;
    const res = await api.saveMeasurement({ dateIso: date, [field]: value });
    setForm(res.measurement);
    setCalc(res.calc);
    flash();
  }

  const cards = [
    { key: "bmi", label: "BMI", value: calc.bmi ? String(calc.bmi).replace(".", ",") : "—", fallback: "vul gewicht en lengte in" },
    { key: "whr", label: "Middel / heup", value: calc.whr ? calc.whr.toFixed(2).replace(".", ",") : "—", fallback: "vul middel en heup in" },
    { key: "whtr", label: "Middel / lengte", value: calc.whtr ? calc.whtr.toFixed(2).replace(".", ",") : "—", fallback: "vul middel en lengte in" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onBack} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Mijn metingen</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94", textTransform: "capitalize" }}>
            {nlDate(date)} {date === isoToday() ? "· vandaag" : ""}
          </div>
        </div>
        <button onClick={() => setDate((d) => isoAdd(d, -1))} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <button
          onClick={() => setDate((d) => isoAdd(d, 1))}
          disabled={date >= isoToday()}
          style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 14, cursor: date >= isoToday() ? "default" : "pointer", color: date >= isoToday() ? "#dde3ea" : "#454e58" }}
        >
          ›
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px", background: "#f4f6f8" }}>
        <div style={{ fontSize: 12.5, color: "#1f5dc4", fontWeight: 600, minHeight: 18, textAlign: "right" }}>{savedMsg}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {cards.map((c) => {
            const z = zone(c.key, calc[c.key]);
            return (
              <div key={c.key} style={{ background: "#000", borderRadius: 14, padding: "14px 12px", color: "#fff" }}>
                <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#2c9dfd" }}>{c.label}</div>
                <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 22, marginTop: 6, color: z.color === "neutral" ? "#fff" : zoneColor[z.color] }}>{c.value}</div>
                <div style={{ fontSize: 10.5, color: "#8b8f94", marginTop: 2 }}>{z.label || c.fallback}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 8, padding: "0 2px" }}>Deze drie worden automatisch berekend uit je gewicht, lengte en omtrek.</div>

        <FieldGroup title="Lichaamssamenstelling" fields={BODY_FIELDS} form={form} onSave={save} />
        <FieldGroup title="Omtrek" fields={GIRTH_FIELDS} form={form} onSave={save} />

        {SCORE_FIELDS.map((s) => (
          <div key={s.key} style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 18, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "#000" }}>{s.label}</div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 20, color: "#1f5dc4" }}>{form[s.key] ?? "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => save(s.key, n)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 44,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1.5px solid " + (form[s.key] === n ? "#1f5dc4" : "#e8ebee"),
                    background: form[s.key] === n ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "#fff",
                    color: form[s.key] === n ? "#fff" : "#8b8f94",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b8f94", marginTop: 8 }}>
              <span>1 · {s.low}</span>
              <span>10 · {s.high}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldGroup({ title, fields, form, onSave }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 18, marginTop: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {fields.map((f) => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#454e58" }}>{f.label}</div>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e8ebee", borderRadius: 11, padding: "8px 12px" }}>
              <input
                type="number"
                step={f.step}
                defaultValue={form[f.key] ?? ""}
                key={f.key + (form[f.key] ?? "")}
                onBlur={(e) => onSave(f.key, e.target.value)}
                placeholder="—"
                style={{ width: 64, border: 0, outline: "none", fontSize: 16, fontWeight: 600, color: "#000", background: "transparent", textAlign: "right" }}
              />
              <span style={{ fontSize: 12, color: "#8b8f94", minWidth: 34 }}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
