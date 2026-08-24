import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { segLight } from "../lib/styles.js";
import Badge from "../ds/Badge.jsx";
import Opvolging from "../components/trainer/Opvolging.jsx";
import ProgramEditor from "../components/trainer/ProgramEditor.jsx";
import ClientSwitcher from "../components/trainer/ClientSwitcher.jsx";
import Nutrition from "../components/trainer/Nutrition.jsx";

export default function TrainerApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [view, setView] = useState("opvolging");

  useEffect(() => {
    (async () => {
      try {
        const me = await api.trainerMe();
        setTrainer(me);
        const list = await api.listClients();
        setClients(list);
        setClientId(list[0]?.id || null);
      } catch {
        navigate("/trainer/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function refreshClients(keepId) {
    const list = await api.listClients();
    setClients(list);
    if (keepId) setClientId(keepId);
  }

  async function logout() {
    await api.trainerLogout();
    navigate("/trainer/login", { replace: true });
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8f94" }}>Laden…</div>;
  if (!trainer) return null;

  const client = clients.find((c) => c.id === clientId);

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f4", color: "#454e58" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", gap: 24, padding: "14px 28px", background: "#000", color: "#fff" }}>
        <img src="/lockup-color.svg" alt="BoedtCamp" style={{ height: 30 }} />
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>Trainer-dashboard</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: "#c7c9cc" }}>{trainer.username}</div>
        <button onClick={logout} style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,.18)", background: "transparent", color: "#c7c9cc", borderRadius: 999, fontSize: 12, cursor: "pointer" }}>
          Afmelden
        </button>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 72px" }}>
        <ClientSwitcher clients={clients} clientId={clientId} setClientId={setClientId} onClientsChanged={refreshClients} />

        {client && (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <Badge tone="blue">Coach-dashboard</Badge>
                <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 32, color: "#000", lineHeight: 1.1, marginTop: 8 }}>
                  {client.naam}
                </div>
                <div style={{ fontSize: 13.5, color: "#7c8794", marginTop: 6 }}>
                  {client.meta}
                  {client.focus ? ` · focus: ${client.focus}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, padding: 4, background: "#fff", border: "1px solid #e8ebee", borderRadius: 999 }}>
                <button onClick={() => setView("opvolging")} style={segLight(view === "opvolging")}>
                  Opvolging
                </button>
                <button onClick={() => setView("editor")} style={segLight(view === "editor")}>
                  Programma-editor
                </button>
                <button onClick={() => setView("voeding")} style={segLight(view === "voeding")}>
                  Voeding
                </button>
              </div>
            </div>

            {view === "opvolging" && <Opvolging clientId={client.id} />}
            {view === "editor" && <ProgramEditor client={client} onClientsChanged={refreshClients} />}
            {view === "voeding" && <Nutrition clientId={client.id} />}
          </>
        )}

        {!client && (
          <div style={{ marginTop: 40, color: "#8b8f94" }}>Nog geen klanten. Voeg er een toe hierboven.</div>
        )}
      </div>
    </div>
  );
}
