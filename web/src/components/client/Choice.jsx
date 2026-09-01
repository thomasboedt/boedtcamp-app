import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { isoToday } from "./food/foodShared.js";

const zoneColor = { green: "#4ecb85", orange: "#f5b25c", red: "#ff8578", neutral: "#8b8f94" };

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

function MeasTeaser({ calc }) {
  const cards = [
    { key: "bmi", label: "BMI", value: calc.bmi ? String(calc.bmi).replace(".", ",") : "—", fallback: "vul gewicht en lengte in" },
    { key: "whr", label: "Middel / heup", value: calc.whr ? calc.whr.toFixed(2).replace(".", ",") : "—", fallback: "vul middel en heup in" },
    { key: "whtr", label: "Middel / lengte", value: calc.whtr ? calc.whtr.toFixed(2).replace(".", ",") : "—", fallback: "vul middel en lengte in" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {cards.map((c) => {
        const z = zone(c.key, calc[c.key]);
        return (
          <div key={c.key} style={{ background: "#000", borderRadius: 14, padding: "14px 12px" }}>
            <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#2c9dfd" }}>{c.label}</div>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 22, marginTop: 6, color: z.color === "neutral" ? "#fff" : zoneColor[z.color] }}>{c.value}</div>
            <div style={{ fontSize: 10.5, color: "#8b8f94", marginTop: 2 }}>{z.label || c.fallback}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChoiceCard({ onClick, eyebrow, title, meta, bar }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", border: 0, cursor: "pointer", borderRadius: 18, padding: "18px 20px", color: "#fff", background: "#000 url(/background-dark-chevron.png) right center/cover no-repeat" }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "#2c9dfd" }}>{eyebrow}</span>
        <span style={{ display: "block", fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 22, marginTop: 5, lineHeight: 1.05 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "#c7c9cc", marginTop: 5 }}>{meta}</span>
        {bar !== undefined && (
          <span style={{ display: "block", height: 6, borderRadius: 999, background: "rgba(255,255,255,.16)", marginTop: 9, overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", borderRadius: 999, width: `${bar}%`, background: "linear-gradient(90deg,#2c9dfd,#1f5dc4)" }} />
          </span>
        )}
      </span>
      <span style={{ flex: "none", width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
        ›
      </span>
    </button>
  );
}

export default function Choice({ client, day, onTrain, onFood, onMeting }) {
  const [foodPct, setFoodPct] = useState(0);
  const [foodMeta, setFoodMeta] = useState("Foto, barcode, spraak of zoeken");
  const [measMeta, setMeasMeta] = useState("Gewicht, omtrek, BMI en hoe je je voelt");
  const [measCalc, setMeasCalc] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [targets, dayRes] = await Promise.all([api.nutritionTargets(), api.nutritionDay(isoToday())]);
        const pct = targets.kcal ? Math.min(100, Math.round((dayRes.totals.kcal / targets.kcal) * 100)) : 0;
        setFoodPct(pct);
        setFoodMeta(dayRes.entries.length ? `${dayRes.totals.kcal} van ${targets.kcal} kcal vandaag` : "Nog niets geregistreerd vandaag");
      } catch {
        // nutrition not reachable yet — card still works, just without a live summary
      }
    })();
    (async () => {
      try {
        const [today, latest] = await Promise.all([api.measurementDay(isoToday()), api.latestMeasurement()]);
        setMeasMeta(today.measurement ? "Vandaag al geregistreerd" : "Nog niets geregistreerd vandaag");
        setMeasCalc(latest.calc);
      } catch {
        // measurements not reachable yet — card still works, just without a live status
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ padding: "18px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{today}</div>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 28, color: "#000", marginTop: 4 }}>
          Hallo {client.naam.split(" ")[0]}
        </div>
        <div style={{ fontSize: 15, color: "#7c8794", marginTop: 8 }}>Wat wil je doen?</div>
      </div>

      {measCalc && <MeasTeaser calc={measCalc} />}

      <ChoiceCard onClick={onTrain} eyebrow="Vandaag" title="Trainen" meta={day ? day.titel : "Nog geen trainingsschema"} />
      <ChoiceCard onClick={onFood} eyebrow="Vandaag" title="Voeding registreren" meta={foodMeta} bar={foodPct} />
      <ChoiceCard onClick={onMeting} eyebrow="Vandaag" title="Metingen bijhouden" meta={measMeta} />
    </div>
  );
}
