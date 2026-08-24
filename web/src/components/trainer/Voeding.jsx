import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import Button from "../../ds/Button.jsx";
import Card from "../../ds/Card.jsx";
import { fieldLabel, inputStyle } from "./Modal.jsx";

const FIELDS = [
  { key: "calorieDoel", label: "Calorieën (kcal/dag)" },
  { key: "eiwitDoel", label: "Eiwit (g/dag)" },
  { key: "koolhydratenDoel", label: "Koolhydraten (g/dag)" },
  { key: "vetDoel", label: "Vet (g/dag)" },
];

export default function Voeding({ client, onClientsChanged }) {
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
      for (const f of FIELDS) {
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
    <div style={{ marginTop: 26, maxWidth: 480 }}>
      <Card>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>Voedingsdoelen</div>
        <div style={{ fontSize: 12.5, color: "#8b8f94", marginTop: 2, marginBottom: 18 }}>Wat je hier instelt, ziet deze klant in de app als richtlijn per dag. Laat een veld leeg om geen doel te tonen.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FIELDS.map((f) => (
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
