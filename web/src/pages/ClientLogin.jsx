import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function ClientLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(nextPin) {
    if (nextPin.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.clientLogin(nextPin);
      navigate("/client", { replace: true });
    } catch (err) {
      setError(err.message);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  function press(key) {
    if (busy) return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    setPin((p) => {
      const next = (p + key).slice(0, 6);
      if (next.length === 6) submit(next);
      return next;
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 24,
      }}
    >
      <img src="/lockup-color.svg" alt="BoedtCamp" style={{ height: 32 }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 24 }}>
          Voer je pincode in
        </div>
        <div style={{ fontSize: 13, color: "#8b8f94", marginTop: 4 }}>De 6-cijferige code die je van je coach kreeg</div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1.5px solid #454e58",
              background: i < pin.length ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "transparent",
            }}
          />
        ))}
      </div>

      {error && <div style={{ fontSize: 13.5, color: "#ff8b82" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            disabled={k === "" || busy}
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              border: "1.5px solid rgba(255,255,255,.14)",
              background: k === "" ? "transparent" : "rgba(255,255,255,.06)",
              color: "#fff",
              fontSize: 24,
              fontWeight: 600,
              cursor: k === "" ? "default" : "pointer",
              visibility: k === "" ? "hidden" : "visible",
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
