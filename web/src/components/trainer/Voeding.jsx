import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import Button from "../../ds/Button.jsx";
import Card from "../../ds/Card.jsx";
import { fieldLabel, inputStyle } from "./Modal.jsx";

const GOAL_FIELDS = [
  { key: "calorieDoel", label: "Calorieën (kcal/dag)" },
  { key: "eiwitDoel", label: "Eiwit (g/dag)" },
  { key: "koolhydratenDoel", label: "Koolhydraten (g/dag)" },
  { key: "vetDoel", label: "Vet (g/dag)" },
];

const BRON_LABEL = { handmatig: "Handmatig", zoeken: "Zoeken", barcode: "Barcode", foto: "Foto" };

export default function Voeding({ client, onClientsChanged }) {
  return (
    <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 24 }}>
      <FoodOverview clientId={client.id} />
      <GoalsForm client={client} onClientsChanged={onClientsChanged} />
    </div>
  );
}

function FoodOverview({ clientId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.foodDashboard(clientId).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [clientId]);

  if (loading || !data) return <div style={{ color: "#8b8f94" }}>Laden…</div>;

  const maxKcal = Math.max(1, ...data.kcalRows.map((r) => r.val), data.goals.calorieDoel || 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {data.kpis.map((k) => (
          <Card key={k.label} style={{ padding: "18px 20px", borderRadius: 14, height: "100%" }}>
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{k.label}</div>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 30, color: "#000", marginTop: 8, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#8b8f94", marginTop: 6 }}>{k.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 18, marginTop: 18, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Calorieën per dag</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>Laatste 7 dagen{data.goals.calorieDoel ? ` · doel ${data.goals.calorieDoel} kcal` : ""}</div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 210, marginTop: 24, paddingBottom: 2, position: "relative" }}>
            {data.goals.calorieDoel && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: `${Math.min(100, Math.round((data.goals.calorieDoel / maxKcal) * 100 * 0.78 + 12))}%`,
                  borderTop: "1.5px dashed #c2c8cf",
                }}
              />
            )}
            {data.kcalRows.every((r) => r.val === 0) && <div style={{ color: "#c2c8cf", fontSize: 13 }}>Nog niets gelogd deze week.</div>}
            {!data.kcalRows.every((r) => r.val === 0) &&
              data.kcalRows.map((b, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#454e58" }}>{b.val || ""}</div>
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "8px 8px 3px 3px",
                      height: Math.round((b.val / maxKcal) * 100 * 0.78 + (b.val ? 12 : 0)) + "%",
                      background: i === data.kcalRows.length - 1 ? "linear-gradient(180deg,#2c9dfd,#1f5dc4)" : "#dde3ea",
                    }}
                  />
                  <div style={{ fontSize: 11, color: "#8b8f94" }}>{b.label}</div>
                </div>
              ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e8ebee", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 2px rgba(10,14,20,.05)" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Vandaag gelogd</div>
          <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2 }}>
            {Math.round(data.todayTotals.kcal)} kcal · E {Math.round(data.todayTotals.eiwit)}g · K {Math.round(data.todayTotals.koolhydraten)}g · V {Math.round(data.todayTotals.vet)}g
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, maxHeight: 260, overflowY: "auto" }}>
            {data.todayEntries.length === 0 && <div style={{ color: "#c2c8cf", fontSize: 13 }}>Nog niets gelogd vandaag.</div>}
            {data.todayEntries.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #f4f6f8" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#000" }}>{e.naam}</div>
                  <div style={{ fontSize: 11.5, color: "#8b8f94" }}>
                    {e.hoeveelheid}
                    {e.eenheid} · {BRON_LABEL[e.bron] || e.bron}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#454e58" }}>{Math.round(e.kcal)} kcal</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsForm({ client, onClientsChanged }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      calorieDoel: client.calorieDoel ?? "",
      eiwitDoel: client.eiwitDoel ?? "",
      koolhydratenDoel: client.koolhydratenDoel ?? "",
      vetDoel: client.vetDoel ?? "",
    });
    setSaved(false);
  }, [client.id]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const data = {};
      for (const f of GOAL_FIELDS) {
        data[f.key] = form[f.key] === "" || form[f.key] === null ? null : Number(form[f.key]);
      }
      await api.updateClient(client.id, data);
      await onClientsChanged(client.id);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <Card>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Voedingsdoelen</div>
        <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2, marginBottom: 18 }}>Wat je hier instelt, ziet deze klant in de app als richtlijn per dag. Laat een veld leeg om geen doel te tonen.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {GOAL_FIELDS.map((f) => (
            <div key={f.key}>
              <div style={fieldLabel}>{f.label}</div>
              <input type="number" min="0" value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} style={inputStyle} placeholder="Geen doel" />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          <Button variant="dark" disabled={saving} onClick={save}>
            Opslaan
          </Button>
          {saved && <span style={{ fontSize: 12.5, color: "#2e9e5b" }}>Opgeslagen.</span>}
        </div>
      </Card>
    </div>
  );
}
