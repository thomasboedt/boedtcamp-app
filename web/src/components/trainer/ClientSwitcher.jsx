import { useState } from "react";
import { api } from "../../lib/api.js";
import Modal, { fieldLabel, inputStyle } from "./Modal.jsx";
import Button from "../../ds/Button.jsx";

export default function ClientSwitcher({ clients, clientId, setClientId, onClientsChanged }) {
  const [addOpen, setAddOpen] = useState(false);
  const [pinClient, setPinClient] = useState(null);

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
      {clients.map((c) => (
        <div key={c.id} style={{ position: "relative" }}>
          <button
            onClick={() => setClientId(c.id)}
            style={{
              textAlign: "left",
              padding: "12px 40px 12px 16px",
              borderRadius: 12,
              cursor: "pointer",
              background: "#fff",
              transition: "all .14s",
              border: "1.5px solid " + (c.id === clientId ? "#2c9dfd" : "#e8ebee"),
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: c.id === clientId ? "#000" : "#454e58" }}>{c.naam}</span>
            <span style={{ display: "block", fontSize: 12, color: "#8b8f94", marginTop: 2 }}>{c.meta}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "#1f5dc4", marginTop: 4, fontWeight: 600 }}>{c.days} trainingsdagen · {c.freq}</span>
          </button>
          <button
            onClick={() => setPinClient(c)}
            title="Pincode instellen"
            style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 8, border: "1px solid #e8ebee", background: "#f4f6f8", color: "#8b8f94", fontSize: 12, cursor: "pointer" }}
          >
            🔑
          </button>
        </div>
      ))}
      <button onClick={() => setAddOpen(true)} style={{ padding: "12px 18px", border: "1.5px dashed #c2c8cf", background: "transparent", borderRadius: 12, fontSize: 13.5, color: "#8b8f94", cursor: "pointer" }}>
        + Klant toevoegen
      </button>

      {addOpen && (
        <AddClientModal
          onClose={() => setAddOpen(false)}
          onCreated={async (id) => {
            setAddOpen(false);
            await onClientsChanged(id);
          }}
        />
      )}
      {pinClient && (
        <PinModal
          client={pinClient}
          onClose={() => setPinClient(null)}
          onSaved={async () => {
            setPinClient(null);
            await onClientsChanged(clientId);
          }}
        />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onCreated }) {
  const [naam, setNaam] = useState("");
  const [meta, setMeta] = useState("");
  const [focus, setFocus] = useState("");
  const [freq, setFreq] = useState("2x per week");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.createClient({ naam, meta, focus, freq, pin });
      onCreated(res.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nieuwe klant" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={fieldLabel}>Naam</div>
          <input required value={naam} onChange={(e) => setNaam(e.target.value)} style={inputStyle} autoFocus />
        </div>
        <div>
          <div style={fieldLabel}>Meta (leeftijd, type training…)</div>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} style={inputStyle} placeholder="bv. 45 jaar · 1-op-1" />
        </div>
        <div>
          <div style={fieldLabel}>Focus</div>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Frequentie</div>
          <input value={freq} onChange={(e) => setFreq(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={fieldLabel}>Pincode (6 cijfers)</div>
          <input
            required
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ ...inputStyle, letterSpacing: "0.3em", fontWeight: 600 }}
            inputMode="numeric"
            placeholder="000000"
          />
        </div>
        {error && <div style={{ fontSize: 13, color: "#c9463c" }}>{error}</div>}
        <Button variant="dark" size="lg" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Bezig…" : "Klant aanmaken"}
        </Button>
      </form>
    </Modal>
  );
}

function PinModal({ client, onClose, onSaved }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.setClientPin(client.id, pin);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Pincode voor ${client.naam}`} onClose={onClose} width={360}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#7c8794" }}>
          {client.naam} gebruikt deze 6-cijferige code om in te loggen in de klant-app. Kies een nieuwe code om de
          huidige te vervangen.
        </p>
        <input
          required
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{ ...inputStyle, letterSpacing: "0.3em", fontWeight: 600, textAlign: "center", fontSize: 20 }}
          inputMode="numeric"
          placeholder="000000"
        />
        {error && <div style={{ fontSize: 13, color: "#c9463c" }}>{error}</div>}
        <Button variant="primary" size="lg" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Bezig…" : "Pincode opslaan"}
        </Button>
      </form>
    </Modal>
  );
}
