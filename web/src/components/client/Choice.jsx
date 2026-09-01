import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { isoToday } from "./food/foodShared.js";

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
        const res = await api.measurementDay(isoToday());
        setMeasMeta(res.measurement ? "Vandaag al geregistreerd" : "Nog niets geregistreerd vandaag");
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

      <ChoiceCard onClick={onTrain} eyebrow="Vandaag" title="Trainen" meta={day ? day.titel : "Nog geen trainingsschema"} />
      <ChoiceCard onClick={onFood} eyebrow="Vandaag" title="Voeding registreren" meta={foodMeta} bar={foodPct} />
      <ChoiceCard onClick={onMeting} eyebrow="Vandaag" title="Metingen bijhouden" meta={measMeta} />
    </div>
  );
}
