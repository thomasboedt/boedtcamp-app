import { useState } from "react";
import Button from "../../ds/Button.jsx";
import Badge from "../../ds/Badge.jsx";
import { api } from "../../lib/api.js";

const RPE_LABELS = ["Licht", "Vlot", "Goed", "Zwaar", "Max"];

export default function Done({ summary, sessionId, onHome }) {
  const [rpe, setRpe] = useState(null);
  const [note, setNote] = useState("");
  const [pain, setPain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    setBusy(true);
    try {
      await api.completeSession(sessionId, { rpe, opmerking: note || null, pijn: pain });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          borderRadius: 18,
          background: "#000 url(/background-dark-chevron.png) right bottom/cover no-repeat",
          color: "#fff",
          padding: 22,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Badge tone="blue">{sent ? "Sessie opgeslagen" : "Bijna klaar"}</Badge>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 26, marginTop: 10 }}>Goed gewerkt</div>
        <div style={{ display: "flex", gap: 26, marginTop: 18 }}>
          <div>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 24 }}>{summary?.doneSets ?? 0}</div>
            <div style={{ fontSize: 11.5, color: "#8b8f94" }}>sets</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 24 }}>{summary?.doneVolume ?? 0}</div>
            <div style={{ fontSize: 11.5, color: "#8b8f94" }}>kg volume</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>Hoe zwaar voelde het?</div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {RPE_LABELS.map((l, i) => (
          <button
            key={l}
            onClick={() => setRpe(i)}
            disabled={sent}
            style={{
              flex: 1,
              padding: "12px 4px",
              borderRadius: 12,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: sent ? "default" : "pointer",
              border: "1.5px solid " + (rpe === i ? "#1f5dc4" : "#e8ebee"),
              background: rpe === i ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "#fff",
              color: rpe === i ? "#fff" : "#7c8794",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>Opmerking voor je coach</div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={sent}
        placeholder="Bv. rechterknie voelde stroef bij de lunges"
        style={{ width: "100%", marginTop: 10, minHeight: 92, padding: "12px 14px", border: "1.5px solid #e8ebee", borderRadius: 12, fontSize: 14, color: "#000", outline: "none", resize: "vertical" }}
      />

      <button
        onClick={() => !sent && setPain((p) => !p)}
        style={{
          marginTop: 14,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 12,
          cursor: sent ? "default" : "pointer",
          textAlign: "left",
          background: "#fff",
          border: "1.5px solid " + (pain ? "#ff8b82" : "#e8ebee"),
          color: pain ? "#c9463c" : "#7c8794",
        }}
      >
        <span style={{ flex: "none", width: 22, height: 22, borderRadius: 7, border: "1.5px solid " + (pain ? "#ff8b82" : "#c2c8cf"), background: pain ? "#ff8b82" : "#fff" }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Ik had pijn tijdens deze training</span>
      </button>

      <div style={{ marginTop: 20 }}>
        {!sent ? (
          <Button variant="primary" size="lg" onClick={send} disabled={busy} style={{ width: "100%", height: 54, fontSize: 16 }}>
            {busy ? "Bezig…" : "Versturen naar coach"}
          </Button>
        ) : (
          <Button variant="dark" size="lg" onClick={onHome} style={{ width: "100%", height: 54, fontSize: 16 }}>
            Terug naar start
          </Button>
        )}
      </div>
      {!sent && (
        <button onClick={onHome} style={{ marginTop: 10, width: "100%", height: 48, border: 0, background: "transparent", color: "#7c8794", fontSize: 14, cursor: "pointer" }}>
          Later
        </button>
      )}
    </div>
  );
}
