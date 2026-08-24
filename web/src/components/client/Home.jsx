import Button from "../../ds/Button.jsx";
import { segLight } from "../../lib/styles.js";

export default function Home({ client, days, dayId, setDayId, history, onStart, onFood }) {
  const day = days.find((d) => d.id === dayId) || days[0];
  const today = new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ padding: "18px 16px 0" }}>
      <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>
        {today}
      </div>
      <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 28, color: "#000", marginTop: 4 }}>
        Hallo {client.naam.split(" ")[0]}
      </div>

      {day ? (
        <div
          style={{
            margin: "18px 0 0",
            borderRadius: 16,
            background: "#000 url(/background-dark-chevron.png) right center/cover no-repeat",
            color: "#fff",
            padding: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: "#2c9dfd" }}>Vandaag</div>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 24, marginTop: 6 }}>
            {day.titel}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" size="lg" onClick={onStart} style={{ width: "100%", height: 54, fontSize: 16 }}>
              Start training
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18, color: "#8b8f94", fontSize: 14 }}>Je coach heeft nog geen trainingsschema klaargezet.</div>
      )}

      {days.length > 1 && (
        <div className="bcs" style={{ display: "flex", gap: 8, padding: "16px 0 0", overflowX: "auto" }}>
          {days.map((d) => (
            <button key={d.id} onClick={() => setDayId(d.id)} style={{ ...segLight(d.id === dayId), flex: "none", whiteSpace: "nowrap", border: "1.5px solid " + (d.id === dayId ? "#000" : "#e8ebee") }}>
              Training {d.volgorde}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onFood}
        style={{
          marginTop: 16,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          border: "1px solid #e8ebee",
          borderRadius: 14,
          background: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🍽️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>Voedingsdagboek</div>
          <div style={{ fontSize: 12, color: "#8b8f94" }}>Log wat je vandaag hebt gegeten</div>
        </div>
        <div style={{ color: "#c2c8cf", fontSize: 16 }}>›</div>
      </button>

      <div style={{ padding: "24px 0 0" }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94", marginBottom: 10 }}>
          Laatste sessies
        </div>
        {history.length === 0 && <div style={{ fontSize: 13.5, color: "#c2c8cf" }}>Nog geen sessies afgerond.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid #e8ebee", borderRadius: 12, background: "#fff" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#f4f6f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Exo',sans-serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 13,
                  color: "#1f5dc4",
                }}
              >
                {s.title.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#8b8f94" }}>{s.sub}</div>
              </div>
              <div style={{ fontSize: 12, color: "#8b8f94", textTransform: "capitalize" }}>{s.when}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 28 }} />
    </div>
  );
}
