import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ds/Button.jsx";
import { api } from "../lib/api.js";

export default function TrainerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.trainerLogin(username, password);
      navigate("/trainer", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <form
        onSubmit={onSubmit}
        style={{ width: 340, background: "#fff", borderRadius: 18, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <img src="/lockup-color.svg" alt="BoedtCamp" style={{ height: 26, alignSelf: "flex-start" }} />
        <div>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 22, color: "#000" }}>
            Trainer-login
          </div>
          <div style={{ fontSize: 13, color: "#8b8f94", marginTop: 4 }}>Coach-dashboard van BoedtCamp</div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#7c8794" }}>
          Gebruikersnaam
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#7c8794" }}>
          Wachtwoord
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {error && <div style={{ fontSize: 13, color: "#c9463c" }}>{error}</div>}

        <Button variant="dark" size="lg" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Bezig…" : "Inloggen"}
        </Button>
      </form>
    </div>
  );
}

const inputStyle = {
  height: 44,
  padding: "0 14px",
  border: "1.5px solid #e8ebee",
  borderRadius: 10,
  fontSize: 15,
  color: "#000",
  outline: "none",
};
