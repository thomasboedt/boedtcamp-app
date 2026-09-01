import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import { nlDateLabel } from "./foodShared.js";

export default function CopyDayScreen({ targetDate, onBack, onCopy, copying }) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState({}); // "dateIso|entryId" -> true

  useEffect(() => {
    setLoading(true);
    api
      .recentFoodDays(targetDate)
      .then((res) => setDays(res.days))
      .finally(() => setLoading(false));
  }, [targetDate]);

  function toggle(dateIso, id) {
    const key = `${dateIso}|${id}`;
    setSelected((s) => {
      const next = { ...s };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  }

  function copyWholeDay(day) {
    onCopy(day.entries);
  }

  function copySelected() {
    const picked = [];
    days.forEach((d) => d.entries.forEach((e) => selected[`${d.dateIso}|${e.id}`] && picked.push(e)));
    if (picked.length) onCopy(picked);
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "8px 18px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onBack} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Kopiëren naar vandaag</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94" }}>Vink aan wat je opnieuw at</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", background: "#f4f6f8" }}>
        {loading && <div style={{ color: "#8b8f94", fontSize: 13 }}>Laden…</div>}
        {!loading && days.length === 0 && (
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "#7c8794", background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 14, padding: "14px 16px" }}>
            Je hebt de voorbije weken nog niets geregistreerd om over te nemen. Voeg eerst een dag toe — daarna kan je die met één tik kopiëren.
          </div>
        )}
        {days.map((d) => (
          <div key={d.dateIso} style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#000", textTransform: "capitalize" }}>{nlDateLabel(d.dateIso)}</div>
                <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 1 }}>
                  {d.entries.length} item{d.entries.length === 1 ? "" : "s"} · {Math.round(d.entries.reduce((a, e) => a + e.kcal, 0))} kcal
                </div>
              </div>
              <button
                onClick={() => copyWholeDay(d)}
                disabled={copying}
                style={{ flex: "none", padding: "9px 14px", border: "1.5px solid #2c9dfd", background: "rgba(44,157,253,.08)", color: "#1f5dc4", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: copying ? "default" : "pointer" }}
              >
                Hele dag
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {d.entries.map((e) => {
                const key = `${d.dateIso}|${e.id}`;
                const checked = !!selected[key];
                return (
                  <button
                    key={e.id}
                    onClick={() => toggle(d.dateIso, e.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, border: 0, background: "transparent", cursor: "pointer", textAlign: "left", borderRadius: 10 }}
                  >
                    <span
                      style={{
                        flex: "none",
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: "1.5px solid " + (checked ? "#1f5dc4" : "#c2c8cf"),
                        background: checked ? "#1f5dc4" : "#fff",
                        color: "#fff",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, color: "#000" }}>{e.naam}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "#8b8f94", marginTop: 1 }}>
                        {Math.round(e.grams)} g · {e.kcal} kcal
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {days.length > 0 && (
        <div style={{ flex: "none", padding: "12px 16px 18px", borderTop: "1px solid #e8ebee", background: "#fff" }}>
          <button
            onClick={copySelected}
            disabled={!selectedCount || copying}
            style={{
              width: "100%",
              height: 50,
              border: 0,
              borderRadius: 12,
              background: selectedCount ? "#000" : "#e8ebee",
              color: selectedCount ? "#fff" : "#8b8f94",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: selectedCount && !copying ? "pointer" : "default",
            }}
          >
            {copying ? "Bezig…" : selectedCount ? `${selectedCount} item${selectedCount === 1 ? "" : "s"} kopiëren` : "Selecteer items om te kopiëren"}
          </button>
        </div>
      )}
    </div>
  );
}
