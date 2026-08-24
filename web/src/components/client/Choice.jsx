import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { isoToday } from "./food/foodShared.js";

export default function Choice({ client, day, onTrain, onFood }) {
  const [foodPct, setFoodPct] = useState(0);
  const [foodMeta, setFoodMeta] = useState("Foto, barcode of zoeken");

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
  }, []);

  const today = new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ padding: "18px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{today}</div>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 28, color: "#000", marginTop: 4 }}>
          Hallo {client.naam.split(" ")[0]}
        </div>
        <div style={{ fontSize: 15, color: "#7c8794", marginTop: 8 }}>Wat wil je doen?</div>
      </div>

      <button
        onClick={onTrain}
        style={{ textAlign: "left", border: 0, cursor: "pointer", borderRadius: 20, padding: 24, color: "#fff", background: "#000 url(/background-dark-chevron.png) right center/cover no-repeat" }}
      >
        <div style={{ fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: "#2c9dfd" }}>Vandaag</div>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 30, marginTop: 10, lineHeight: 1.05 }}>Trainen</div>
        <div style={{ fontSize: 14, color: "#c7c9cc", marginTop: 8 }}>{day ? day.titel : "Nog geen trainingsschema"}</div>
        <div style={{ display: "inline-block", marginTop: 18, padding: "13px 22px", borderRadius: 999, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)", fontSize: 15, fontWeight: 600 }}>
          Open mijn schema
        </div>
      </button>

      <button
        onClick={onFood}
        style={{ textAlign: "left", border: 0, cursor: "pointer", borderRadius: 20, padding: 24, color: "#fff", background: "#000 url(/background-dark-chevron.png) right center/cover no-repeat" }}
      >
        <div style={{ fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: "#2c9dfd" }}>Vandaag</div>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 30, marginTop: 10, lineHeight: 1.05 }}>Voeding registreren</div>
        <div style={{ fontSize: 14, color: "#c7c9cc", marginTop: 8 }}>{foodMeta}</div>
        <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.16)", marginTop: 14, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, width: `${foodPct}%`, background: "linear-gradient(90deg,#2c9dfd,#1f5dc4)" }} />
        </div>
        <div style={{ display: "inline-block", marginTop: 18, padding: "13px 22px", borderRadius: 999, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)", fontSize: 15, fontWeight: 600 }}>
          Foto, barcode of zoeken
        </div>
      </button>
    </div>
  );
}
