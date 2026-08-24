import { MEALS, nlDateLabel } from "./foodShared.js";

const rowIcon = (path) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

export default function FoodDiary({ date, entries, totals, targets, onPrevDay, onNextDay, canGoNext, onPhotoFile, onOpenScan, onOpenSearch, onEditEntry, onRemoveEntry, onBack }) {
  const kcalLeft = targets.kcal - totals.kcal;
  const macroRows = [
    { id: "carbs", label: "Koolhydraten", val: totals.carbs, target: targets.carbs, color: "#2c9dfd" },
    { id: "protein", label: "Eiwitten", val: totals.protein, target: targets.protein, color: "#1f5dc4" },
    { id: "fat", label: "Vetten", val: totals.fat, target: targets.fat, color: "#8b8f94" },
  ];

  const groups = MEALS.map((m) => ({ ...m, items: entries.filter((e) => e.meal === m.id) }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 12px", borderBottom: "1px solid #e8ebee" }}>
        <button onClick={onBack} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 15, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 17, color: "#000" }}>Voedingsdagboek</div>
          <div style={{ fontSize: 11.5, color: "#8b8f94", textTransform: "capitalize" }}>{nlDateLabel(date)}</div>
        </div>
        <button onClick={onPrevDay} style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#454e58" }}>
          ‹
        </button>
        <button
          onClick={onNextDay}
          disabled={!canGoNext}
          style={{ flex: "none", width: 34, height: 34, border: "1px solid #e8ebee", background: "#fff", borderRadius: 10, fontSize: 14, cursor: canGoNext ? "pointer" : "default", color: canGoNext ? "#454e58" : "#dde3ea" }}
        >
          ›
        </button>
      </div>

      <div style={{ padding: "16px 16px 28px", background: "#f4f6f8" }}>
        <div style={{ background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 38, color: "#000", lineHeight: 1 }}>{totals.kcal}</div>
            <div style={{ fontSize: 13, color: "#8b8f94" }}>/ {targets.kcal} kcal</div>
          </div>
          <div style={{ fontSize: 12.5, color: "#1f5dc4", fontWeight: 600, marginTop: 4 }}>
            {kcalLeft >= 0 ? `Nog ${kcalLeft} kcal over vandaag` : `${Math.abs(kcalLeft)} kcal boven je doel`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
            {macroRows.map((r) => (
              <div key={r.id}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 13, color: "#454e58" }}>{r.label}</div>
                  <div style={{ fontSize: 12.5, color: "#8b8f94" }}>
                    <span style={{ color: "#000", fontWeight: 600 }}>{Math.round(r.val)} g</span> / {r.target} g
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "#f4f6f8", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${Math.min(100, r.target ? (r.val / r.target) * 100 : 0)}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, background: "#000", color: "#fff", cursor: "pointer" }}>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => onPhotoFile(e.target.files?.[0])} style={{ display: "none" }} />
            <span style={{ flex: "none", width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#2c9dfd,#1f5dc4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {rowIcon(
                <>
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </>
              )}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Foto trekken</span>
              <span style={{ display: "block", fontSize: 12, color: "#8b8f94", marginTop: 1 }}>Van je bord of de verpakking — wij herkennen het</span>
            </span>
          </label>
          <button onClick={onOpenScan} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, background: "#fff", border: "1.5px solid #e8ebee", cursor: "pointer", textAlign: "left" }}>
            <span style={{ flex: "none", width: 38, height: 38, borderRadius: 11, background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#1f5dc4" }}>
              {rowIcon(
                <>
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <path d="M8 7v10" />
                  <path d="M12 7v10" />
                  <path d="M17 7v10" />
                </>
              )}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#000" }}>Barcode scannen</span>
              <span style={{ display: "block", fontSize: 12, color: "#8b8f94", marginTop: 1 }}>Direct de juiste waarden uit Open Food Facts</span>
            </span>
          </button>
          <button onClick={onOpenSearch} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, background: "#fff", border: "1.5px solid #e8ebee", cursor: "pointer", textAlign: "left" }}>
            <span style={{ flex: "none", width: 38, height: 38, borderRadius: 11, background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#1f5dc4" }}>
              {rowIcon(
                <>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </>
              )}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#000" }}>Product opzoeken</span>
              <span style={{ display: "block", fontSize: 12, color: "#8b8f94", marginTop: 1 }}>Zoek op naam of merk</span>
            </span>
          </button>
        </div>

        {groups.map((m) => (
          <div key={m.id} style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px 8px" }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8f94" }}>{m.nl}</div>
              <div style={{ flex: 1, height: 1, background: "#e8ebee" }} />
              <div style={{ fontSize: 11.5, color: "#8b8f94" }}>{Math.round(m.items.reduce((a, i) => a + i.kcal, 0))} kcal</div>
            </div>
            {m.items.length === 0 && <div style={{ fontSize: 12.5, color: "#c2c8cf" }}>Nog niets geregistreerd</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {m.items.map((i) => (
                <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fff", border: "1.5px solid #e8ebee", borderRadius: 14 }}>
                  <div style={{ flex: "none", width: 38, height: 38, borderRadius: 10, background: "#f4f6f8" }} />
                  <button onClick={() => onEditEntry(i)} style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", textAlign: "left", cursor: "pointer", padding: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{i.naam}</div>
                    <div style={{ fontSize: 11.5, color: "#8b8f94", marginTop: 2 }}>{Math.round(i.grams)} g{i.merk ? " · " + i.merk : ""}</div>
                  </button>
                  <div style={{ flex: "none", textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1f5dc4" }}>{i.kcal} kcal</div>
                    <button onClick={() => onRemoveEntry(i)} style={{ marginTop: 4, border: 0, background: "transparent", fontSize: 12, color: "#c2c8cf", cursor: "pointer", padding: 0 }}>
                      verwijderen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
