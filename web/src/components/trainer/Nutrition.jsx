import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { segLight } from "../../lib/styles.js";

const MEAL_LABEL = { ontbijt: "Ontbijt", lunch: "Lunch", avond: "Avondeten", snack: "Tussendoor" };
const PERIODS = [
  { id: "dag", label: "14 dagen" },
  { id: "maand", label: "30 dagen" },
  { id: "jaar", label: "12 maanden" },
];

const MACROS = [
  { id: "pctCarbs", nl: "Koolhydraten", kcalPerG: 4, color: "#2c9dfd" },
  { id: "pctProtein", nl: "Eiwitten", kcalPerG: 4, color: "#1f5dc4" },
  { id: "pctFat", nl: "Vetten", kcalPerG: 9, color: "#8b8f94" },
];

const ACTIVITY = [
  { id: "zittend", nl: "Zittend werk, weinig beweging", f: 1.2 },
  { id: "licht", nl: "Licht actief · 1-3 trainingen per week", f: 1.375 },
  { id: "matig", nl: "Matig actief · 3-5 trainingen per week", f: 1.55 },
  { id: "zwaar", nl: "Zwaar actief · 6-7 trainingen per week", f: 1.725 },
  { id: "topsport", nl: "Topsport of zwaar fysiek werk", f: 1.9 },
];

const KCAL_GOALS = [
  { id: "afvallen", nl: "Afvallen", delta: -500, sub: "± 0,5 kg per week" },
  { id: "onderhoud", nl: "Op gewicht blijven", delta: 0, sub: "behoud" },
  { id: "aankomen", nl: "Spiermassa opbouwen", delta: 350, sub: "rustig opbouwen" },
];

const CALC_DEFAULTS = { calcSex: "vrouw", calcAge: 40, calcWeight: 70, calcHeight: 170, calcActivity: "licht", calcGoal: "onderhoud", calcFormula: "mifflin" };

function calcResult(c) {
  const w = Math.max(1, Number(c.calcWeight) || 0);
  const h = Math.max(1, Number(c.calcHeight) || 0);
  const a = Math.max(1, Number(c.calcAge) || 0);
  const man = c.calcSex === "man";
  const bmr =
    c.calcFormula === "harris"
      ? man
        ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
        : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a
      : 10 * w + 6.25 * h - 5 * a + (man ? 5 : -161);
  const activity = ACTIVITY.find((x) => x.id === c.calcActivity) || ACTIVITY[1];
  const tdee = bmr * activity.f;
  const goal = KCAL_GOALS.find((g) => g.id === c.calcGoal) || KCAL_GOALS[1];
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), advies: Math.round((tdee + goal.delta) / 10) * 10, goal };
}

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

export default function Nutrition({ clientId, client }) {
  const [period, setPeriod] = useState("dag");
  const [day, setDay] = useState(isoToday());
  const [data, setData] = useState(null);
  const [targetDraft, setTargetDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setDay(isoToday());
  }, [clientId]);

  useEffect(() => {
    api.clientNutrition(clientId, period, day).then((res) => {
      setData(res);
      // A client who's never used the calculator has these as explicit
      // null from the DB — {...CALC_DEFAULTS, ...res.target} would let
      // that null override the default rather than fall back to it, so
      // merge key by key instead.
      const merged = { ...res.target };
      for (const key of Object.keys(CALC_DEFAULTS)) {
        if (merged[key] === null || merged[key] === undefined) merged[key] = CALC_DEFAULTS[key];
      }
      setTargetDraft(merged);
    });
  }, [clientId, period, day]);

  async function saveTargets() {
    setSaving(true);
    setSaveError("");
    try {
      await api.setNutritionTargets(clientId, targetDraft);
      setSaved("Doelen opgeslagen");
      const res = await api.clientNutrition(clientId, period, day);
      setData(res);
      setTimeout(() => setSaved(""), 2500);
    } catch (err) {
      setSaveError(err.message || "Opslaan is niet gelukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  function setCalc(field, value) {
    setTargetDraft((t) => ({ ...t, [field]: value }));
  }

  function setPct(id, value) {
    setTargetDraft((t) => ({ ...t, [id]: Math.max(0, Math.round(Number(value) || 0)) }));
  }

  function balancePct() {
    setTargetDraft((t) => {
      const sum = t.pctCarbs + t.pctProtein + t.pctFat || 1;
      const c = Math.round((t.pctCarbs / sum) * 100);
      const p = Math.round((t.pctProtein / sum) * 100);
      return { ...t, pctCarbs: c, pctProtein: p, pctFat: 100 - c - p };
    });
  }

  if (!data || !targetDraft) return <div style={{ marginTop: 26, color: "#8b8f94" }}>Laden…</div>;

  const maxBar = Math.max(1, ...data.bars.map((b) => b.val));

  const cr = calcResult(targetDraft);
  const pctSum = targetDraft.pctCarbs + targetDraft.pctProtein + targetDraft.pctFat;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 18, marginTop: 26, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Caloriebehoefte berekenen</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Rustverbruik × activiteit, gecorrigeerd voor het doel van deze klant.</div>
          {client?.meta && <div style={{ fontSize: 12, color: "#1f5dc4", fontWeight: 600, marginTop: 8 }}>{client.meta}</div>}

          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {[
              { id: "vrouw", nl: "Vrouw" },
              { id: "man", nl: "Man" },
            ].map((x) => (
              <button
                key={x.id}
                onClick={() => setCalc("calcSex", x.id)}
                style={{
                  flex: 1,
                  padding: "9px 6px",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1.5px solid " + (targetDraft.calcSex === x.id ? "#1f5dc4" : "#e8ebee"),
                  background: targetDraft.calcSex === x.id ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "#fff",
                  color: targetDraft.calcSex === x.id ? "#fff" : "#7c8794",
                }}
              >
                {x.nl}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {[
              { key: "calcAge", label: "Leeftijd", unit: "jaar" },
              { key: "calcWeight", label: "Gewicht", unit: "kg" },
              { key: "calcHeight", label: "Lengte", unit: "cm" },
            ].map((f) => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "#454e58" }}>{f.label}</div>
                <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e8ebee", borderRadius: 10, padding: "7px 12px" }}>
                  <input
                    type="number"
                    value={targetDraft[f.key]}
                    onChange={(e) => setCalc(f.key, Number(e.target.value))}
                    style={{ width: 62, border: 0, outline: "none", fontSize: 15, fontWeight: 600, color: "#000", background: "transparent", textAlign: "right" }}
                  />
                  <span style={{ fontSize: 12, color: "#8b8f94" }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", marginTop: 18 }}>Activiteit</div>
          <select
            value={targetDraft.calcActivity}
            onChange={(e) => setCalc("calcActivity", e.target.value)}
            style={{ width: "100%", marginTop: 8, height: 44, padding: "0 12px", border: "1.5px solid #e8ebee", borderRadius: 11, fontSize: 13.5, color: "#000", background: "#fff", outline: "none", cursor: "pointer" }}
          >
            {ACTIVITY.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nl} (×{a.f})
              </option>
            ))}
          </select>

          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", marginTop: 18 }}>Doel</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {KCAL_GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setCalc("calcGoal", g.id)}
                style={{
                  flex: 1,
                  padding: "11px 6px",
                  borderRadius: 11,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  border: "1.5px solid " + (targetDraft.calcGoal === g.id ? "#1f5dc4" : "#e8ebee"),
                  background: targetDraft.calcGoal === g.id ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "#fff",
                  color: targetDraft.calcGoal === g.id ? "#fff" : "#7c8794",
                }}
              >
                {g.nl}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
            <div style={{ background: "#f4f6f8", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>Rustverbruik</div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 20, color: "#000", marginTop: 5, lineHeight: 1 }}>{cr.bmr}</div>
              <div style={{ fontSize: 11, color: "#8b8f94", marginTop: 3 }}>kcal</div>
            </div>
            <div style={{ background: "#f4f6f8", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>Met activiteit</div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 20, color: "#000", marginTop: 5, lineHeight: 1 }}>{cr.tdee}</div>
              <div style={{ fontSize: 11, color: "#8b8f94", marginTop: 3 }}>kcal</div>
            </div>
            <div style={{ background: "#000", borderRadius: 12, padding: "12px 14px", color: "#fff" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#2c9dfd" }}>Advies</div>
              <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 20, marginTop: 5, lineHeight: 1 }}>{cr.advies}</div>
              <div style={{ fontSize: 11, color: "#8b8f94", marginTop: 3 }}>kcal</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#8b8f94", marginTop: 10 }}>
            {cr.goal.nl}
            {cr.goal.delta ? ` · ${cr.goal.delta > 0 ? "+" : ""}${cr.goal.delta} kcal` : " · geen correctie"}
          </div>

          <button
            onClick={() => setCalc("kcal", Math.max(800, cr.advies))}
            disabled={cr.advies === targetDraft.kcal}
            style={{
              marginTop: 16,
              width: "100%",
              height: 46,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              border: 0,
              cursor: cr.advies === targetDraft.kcal ? "default" : "pointer",
              background: cr.advies === targetDraft.kcal ? "#f4f6f8" : "linear-gradient(135deg,#2c9dfd,#1f5dc4)",
              color: cr.advies === targetDraft.kcal ? "#8b8f94" : "#fff",
            }}
          >
            {cr.advies === targetDraft.kcal ? "Staat al ingesteld als doel" : `Overnemen als doel (${cr.advies} kcal)`}
          </button>

          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {[
              { id: "mifflin", nl: "Mifflin-St Jeor" },
              { id: "harris", nl: "Harris-Benedict" },
            ].map((x) => (
              <button
                key={x.id}
                onClick={() => setCalc("calcFormula", x.id)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1.5px solid " + (targetDraft.calcFormula === x.id ? "#2c9dfd" : "#e8ebee"),
                  background: targetDraft.calcFormula === x.id ? "rgba(44,157,253,.1)" : "#fff",
                  color: targetDraft.calcFormula === x.id ? "#1f5dc4" : "#8b8f94",
                }}
              >
                {x.nl}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.6, color: "#c2c8cf", marginTop: 8 }}>Een schatting, geen meting. Volg het gewicht twee tot drie weken op en stuur bij.</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Voedingsdoelen</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Wat je hier instelt, ziet deze klant in de app als richtlijn per dag.</div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, padding: "14px 16px", borderRadius: 12, background: "#f4f6f8" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#000" }}>Calorieën per dag</div>
              <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 1 }}>Basis voor de berekening</div>
            </div>
            <button onClick={() => setCalc("kcal", Math.max(100, targetDraft.kcal - 50))} style={{ flex: "none", width: 36, height: 36, border: "1.5px solid #c2c8cf", background: "#fff", borderRadius: 10, fontSize: 18, color: "#454e58", cursor: "pointer" }}>
              −
            </button>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 10, padding: "7px 12px" }}>
              <input
                type="number"
                step={50}
                value={targetDraft.kcal}
                onChange={(e) => setCalc("kcal", Math.max(1, Number(e.target.value) || 1))}
                style={{ width: 66, border: 0, outline: "none", fontSize: 15, fontWeight: 600, color: "#000", background: "transparent", textAlign: "right" }}
              />
              <span style={{ fontSize: 12, color: "#8b8f94" }}>kcal</span>
            </div>
            <button onClick={() => setCalc("kcal", targetDraft.kcal + 50)} style={{ flex: "none", width: 36, height: 36, border: "1.5px solid #c2c8cf", background: "#fff", borderRadius: 10, fontSize: 18, color: "#454e58", cursor: "pointer" }}>
              +
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94" }}>Verdeling in procent</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: pctSum === 100 ? "#1f5dc4" : "#c9463c" }}>samen {pctSum}%</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {MACROS.map((m) => {
              const pct = targetDraft[m.id];
              const grams = Math.round(((targetDraft.kcal * pct) / 100 / m.kcalPerG) * 10) / 10;
              return (
                <div key={m.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: "#000", fontWeight: 600 }}>{m.nl}</div>
                      <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 1 }}>
                        {m.kcalPerG} kcal per gram · {Math.round((targetDraft.kcal * pct) / 100)} kcal
                      </div>
                    </div>
                    <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 5, border: "1.5px solid #e8ebee", borderRadius: 10, padding: "7px 10px" }}>
                      <input
                        type="number"
                        step={1}
                        value={pct}
                        onChange={(e) => setPct(m.id, e.target.value)}
                        style={{ width: 46, border: 0, outline: "none", fontSize: 15, fontWeight: 600, color: "#000", background: "transparent", textAlign: "right" }}
                      />
                      <span style={{ fontSize: 12, color: "#8b8f94" }}>%</span>
                    </div>
                    <div style={{ flex: "none", minWidth: 58, textAlign: "right", fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#1f5dc4" }}>{grams}</div>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "#f4f6f8", marginTop: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, width: `${Math.min(100, pct)}%`, background: m.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {pctSum !== 100 && (
            <button onClick={balancePct} style={{ marginTop: 14, width: "100%", height: 42, border: "1.5px solid #2c9dfd", background: "rgba(44,157,253,.08)", color: "#1f5dc4", borderRadius: 12, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              Naar 100% herschalen
            </button>
          )}

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
          {saveError && (
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#c9463c", marginTop: 12, background: "#fff5f4", border: "1.5px solid #ffd6d2", borderRadius: 12, padding: "10px 12px" }}>
              {saveError}
            </div>
          )}
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
