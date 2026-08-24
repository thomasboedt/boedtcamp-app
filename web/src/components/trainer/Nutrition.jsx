import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { segLight } from "../../lib/styles.js";

const MEAL_LABEL = { ontbijt: "Ontbijt", lunch: "Lunch", avond: "Avondeten", snack: "Tussendoor" };
const PERIODS = [
  { id: "dag", label: "14 dagen" },
  { id: "maand", label: "30 dagen" },
  { id: "jaar", label: "12 maanden" },
];

function isoAdd(iso, days) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}
function isoToday() {
  return new Date().toLocaleDateString("en-CA");
}
function nlDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}

export default function Nutrition({ clientId }) {
  const [period, setPeriod] = useState("dag");
  const [day, setDay] = useState(isoToday());
  const [data, setData] = useState(null);
  const [targetDraft, setTargetDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setDay(isoToday());
  }, [clientId]);

  useEffect(() => {
    api.clientNutrition(clientId, period, day).then((res) => {
      setData(res);
      setTargetDraft(res.target);
    });
  }, [clientId, period, day]);

  async function saveTargets() {
    setSaving(true);
    try {
      await api.setNutritionTargets(clientId, targetDraft);
      setSaved("Doelen opgeslagen");
      const res = await api.clientNutrition(clientId, period, day);
      setData(res);
      setTimeout(() => setSaved(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!data || !targetDraft) return <div style={{ marginTop: 26, color: "#8b8f94" }}>Laden…</div>;

  const maxBar = Math.max(1, ...data.bars.map((b) => b.val));

  const fields = [
    { key: "kcal", label: "Calorieën", unit: "kcal" },
    { key: "carbs", label: "Koolhydraten", unit: "g" },
    { key: "protein", label: "Eiwitten", unit: "g" },
    { key: "fat", label: "Vetten", unit: "g" },
  ];

  const goalSplitKcal = targetDraft.carbs * 4 + targetDraft.protein * 4 + targetDraft.fat * 9;
  const goalSplit = [
    { label: "Koolhydraten", val: targetDraft.carbs, pct: goalSplitKcal ? Math.round(((targetDraft.carbs * 4) / goalSplitKcal) * 100) : 0, color: "#2c9dfd" },
    { label: "Eiwitten", val: targetDraft.protein, pct: goalSplitKcal ? Math.round(((targetDraft.protein * 4) / goalSplitKcal) * 100) : 0, color: "#1f5dc4" },
    { label: "Vetten", val: targetDraft.fat, pct: goalSplitKcal ? Math.round(((targetDraft.fat * 9) / goalSplitKcal) * 100) : 0, color: "#8b8f94" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 18, marginTop: 26, alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Voedingsdoelen</div>
        <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Wat je hier instelt, ziet deze klant in de app als richtlijn per dag.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {fields.map((f) => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "#454e58" }}>{f.label}</div>
              <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e8ebee", borderRadius: 10, padding: "7px 12px" }}>
                <input
                  type="number"
                  value={targetDraft[f.key]}
                  onChange={(e) => setTargetDraft((t) => ({ ...t, [f.key]: Number(e.target.value) }))}
                  style={{ width: 72, border: 0, outline: "none", fontSize: 15, fontWeight: 600, color: "#000", background: "transparent", textAlign: "right" }}
                />
                <span style={{ fontSize: 12, color: "#8b8f94" }}>{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={saveTargets}
            disabled={saving}
            style={{ height: 40, padding: "0 18px", border: 0, borderRadius: 999, background: "#000", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Bezig…" : "Doelen opslaan"}
          </button>
          {saved && <div style={{ fontSize: 12.5, color: "#1f5dc4", fontWeight: 600 }}>{saved}</div>}
        </div>

        <div style={{ height: 1, background: "#e8ebee", margin: "18px 0" }} />
        <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>Verdeling van je doel</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {goalSplit.map((m) => (
            <div key={m.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#7c8794" }}>
                <span>{m.label}</span>
                <span style={{ fontWeight: 600, color: "#454e58" }}>{m.val} g · {m.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "#f4f6f8", marginTop: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, width: `${m.pct}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#8b8f94", marginTop: 14 }}>
          Samen {Math.round(goalSplitKcal)} kcal uit de macro's — je doel staat op {targetDraft.kcal} kcal.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Geregistreerde voeding</div>
              <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>
                {PERIODS.find((p) => p.id === period)?.label} · doel {data.target.kcal} kcal/dag
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, padding: 4, background: "#f4f6f8", borderRadius: 999 }}>
              {PERIODS.map((p) => (
                <button key={p.id} onClick={() => setPeriod(p.id)} style={segLight(period === p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 20 }}>
            {data.kpis.map((k) => (
              <div key={k.label} style={{ background: "#f4f6f8", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>{k.label}</div>
                <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 24, color: "#000", marginTop: 6, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 190, marginTop: 24 }}>
            {data.bars.map((b, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: 10, color: "#8b8f94", whiteSpace: "nowrap" }}>{b.val || ""}</div>
                <div style={{ width: "100%", borderRadius: "6px 6px 2px 2px", height: `${Math.round((b.val / maxBar) * 100 * 0.82 + (b.val ? 6 : 0))}%`, background: i === data.bars.length - 1 ? "linear-gradient(180deg,#2c9dfd,#1f5dc4)" : "#dde3ea" }} />
                <div style={{ fontSize: 10.5, color: "#8b8f94", whiteSpace: "nowrap" }}>{b.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 22, paddingTop: 18, borderTop: "1px solid #e8ebee" }}>
            {data.split.map((m) => (
              <div key={m.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#7c8794" }}>
                  <span>{m.label}</span>
                  <span style={{ fontWeight: 600, color: "#454e58" }}>{m.val} g · {m.pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "#f4f6f8", marginTop: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${m.pct}%`, background: "#2c9dfd" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Dag in detail</div>
              <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2, textTransform: "capitalize" }}>
                {nlDate(day)} · {data.dayTotals.kcal} kcal
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setDay((d) => isoAdd(d, -1))} style={{ width: 34, height: 34, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#454e58" }}>
                ‹
              </button>
              <button
                onClick={() => setDay((d) => isoAdd(d, 1))}
                disabled={day >= isoToday()}
                style={{ width: 34, height: 34, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 14, cursor: day >= isoToday() ? "default" : "pointer", color: day >= isoToday() ? "#dde3ea" : "#454e58" }}
              >
                ›
              </button>
            </div>
          </div>

          {data.dayRows.length === 0 ? (
            <div style={{ marginTop: 16, color: "#8b8f94", fontSize: 13.5 }}>Deze klant registreerde niets op deze dag.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr .7fr .6fr .5fr .5fr .8fr", marginTop: 16, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", paddingBottom: 10, borderBottom: "1px solid #e8ebee" }}>
                <div>Product</div>
                <div>Maaltijd</div>
                <div>Portie</div>
                <div>Kcal</div>
                <div>Kh</div>
                <div>Bron</div>
              </div>
              {data.dayRows.map((r) => (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.6fr .7fr .6fr .5fr .5fr .8fr", padding: "11px 0", borderBottom: "1px solid #f4f6f8", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{r.naam}</div>
                  <div style={{ fontSize: 13, color: "#7c8794" }}>{MEAL_LABEL[r.meal] || r.meal}</div>
                  <div style={{ fontSize: 13, color: "#7c8794" }}>{r.grams} g</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#000" }}>{r.kcal}</div>
                  <div style={{ fontSize: 13, color: "#7c8794" }}>{r.carbs}</div>
                  <div style={{ fontSize: 12, color: "#c2c8cf" }}>{r.bron}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
