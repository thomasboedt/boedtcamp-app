import Button from "../../../ds/Button.jsx";
import { MEALS, round1, scaleToGrams } from "./foodShared.js";

const numField = { display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e8ebee", borderRadius: 11, padding: "8px 12px", background: "#fff" };
const stepBtn = { width: 48, height: 48, flex: "none", border: "1.5px solid #c2c8cf", background: "#fff", borderRadius: 14, fontSize: 22, color: "#454e58", cursor: "pointer" };

export default function FoodEditScreen({ draft, setDraft, onCancel, onSave, saving, saveError }) {
  function setUnitCount(unit, count) {
    setDraft((d) => {
      const u = Math.max(1, Math.round(unit === undefined ? d.unit ?? d.grams : unit));
      const n = Math.max(1, Math.round(count === undefined ? d.count ?? 1 : count));
      const g = u * n;
      return { ...d, unit: u, count: n, grams: g, ...scaleToGrams(d.per100, g) };
    });
  }

  const per100 = draft.per100;
  const fields = [
    { key: "kcal", label: "Calorieën", unit: "kcal", step: 1 },
    { key: "carbs", label: "Koolhydraten", unit: "g", step: 0.5 },
    { key: "protein", label: "Eiwitten", unit: "g", step: 0.5 },
    { key: "fat", label: "Vetten", unit: "g", step: 0.5 },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 18px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onCancel} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Waarden nakijken</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94" }}>Pas aan wat niet klopt — jouw waarde telt</div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 28px", background: "#f4f6f8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16 }}>
          <div style={{ flex: "none", width: 48, height: 48, borderRadius: 12, background: "#f4f6f8" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#000" }}>{draft.naam}</div>
            <div style={{ fontSize: 12, color: "#8b8f94", marginTop: 2 }}>{draft.merk || " "}</div>
          </div>
        </div>
        {per100 && (
          <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 8, padding: "0 2px" }}>
            {Math.round(per100.kcal100)} kcal · {round1(per100.carbs100)} kh · {round1(per100.protein100)} eiw · {round1(per100.fat100)} vet per 100 g
          </div>
        )}

        <div style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 16, marginTop: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>Hoeveel heb je gegeten?</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ flex: "none", width: 70, fontSize: 13, color: "#454e58" }}>Portie</div>
            <button onClick={() => setUnitCount((draft.unit ?? draft.grams) - 10, undefined)} style={{ ...stepBtn, width: 46, height: 46 }}>
              −
            </button>
            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <input
                type="number"
                value={draft.unit ?? draft.grams}
                onChange={(e) => setUnitCount(Number(e.target.value), undefined)}
                style={{ width: "100%", border: 0, outline: "none", textAlign: "center", fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 26, color: "#000", background: "transparent" }}
              />
              <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: -2, whiteSpace: "nowrap" }}>gram / ml</div>
            </div>
            <button onClick={() => setUnitCount((draft.unit ?? draft.grams) + 10, undefined)} style={{ ...stepBtn, width: 46, height: 46 }}>
              +
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ flex: "none", width: 70, fontSize: 13, color: "#454e58" }}>Aantal</div>
            <button onClick={() => setUnitCount(undefined, (draft.count || 1) - 1)} style={{ ...stepBtn, width: 46, height: 46 }}>
              −
            </button>
            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <input
                type="number"
                value={draft.count || 1}
                onChange={(e) => setUnitCount(undefined, Number(e.target.value))}
                style={{ width: "100%", border: 0, outline: "none", textAlign: "center", fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 26, color: "#000", background: "transparent" }}
              />
              <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: -2, whiteSpace: "nowrap" }}>keer</div>
            </div>
            <button onClick={() => setUnitCount(undefined, (draft.count || 1) + 1)} style={{ ...stepBtn, width: 46, height: 46 }}>
              +
            </button>
          </div>
          <div style={{ fontSize: 13, color: "#1f5dc4", fontWeight: 600, marginTop: 14, paddingTop: 12, borderTop: "1px solid #f4f6f8" }}>
            {(draft.count || 1)} × {Math.round(draft.unit ?? draft.grams)} g = {Math.round(draft.grams)} g in totaal
          </div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94", marginTop: 18 }}>Bij welke maaltijd?</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {MEALS.map((m) => (
            <button
              key={m.id}
              onClick={() => setDraft((d) => ({ ...d, meal: m.id }))}
              style={{
                flex: 1,
                padding: "9px 4px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                border: "1.5px solid " + (draft.meal === m.id ? "#000" : "#e8ebee"),
                background: draft.meal === m.id ? "#000" : "#fff",
                color: draft.meal === m.id ? "#fff" : "#7c8794",
              }}
            >
              {m.nl}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 16, marginTop: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>Voedingswaarden voor deze portie</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {fields.map((f) => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#454e58" }}>{f.label}</div>
                <div style={{ ...numField, flex: "none" }}>
                  <input
                    type="number"
                    step={f.step}
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: Number(e.target.value) }))}
                    style={{ width: 64, border: 0, outline: "none", fontSize: 16, fontWeight: 600, color: "#000", background: "transparent", textAlign: "right" }}
                  />
                  <span style={{ fontSize: 12, color: "#8b8f94" }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: "#8b8f94", marginTop: 12 }}>
            {draft.bron === "foto-herkenning"
              ? "Deze waarden zijn een schatting op basis van je foto. Pas ze aan als je iets anders at."
              : "Deze waarden komen uit Open Food Facts en zijn omgerekend naar jouw portie. Pas ze aan als je iets anders at."}
          </div>
        </div>

        {saveError && (
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#c9463c", marginTop: 14, background: "#fff5f4", border: "1.5px solid #ffd6d2", borderRadius: 12, padding: "10px 12px" }}>
            {saveError}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <Button variant="primary" size="lg" onClick={onSave} disabled={saving} style={{ width: "100%", height: 54, fontSize: 16 }}>
            {saving ? "Bezig…" : draft.editing ? "Wijzigingen opslaan" : "Toevoegen aan mijn dag"}
          </Button>
        </div>
        <button onClick={onCancel} style={{ marginTop: 8, width: "100%", height: 48, border: 0, background: "transparent", color: "#7c8794", fontSize: 14, cursor: "pointer" }}>
          Annuleren
        </button>
      </div>
    </div>
  );
}
