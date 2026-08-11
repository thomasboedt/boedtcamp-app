export default function Modal({ title, onClose, children, width = 420 }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,14,20,.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: "100%", background: "#fff", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 19, color: "#000" }}>{title}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: "1.5px solid #e8ebee", background: "#fff", borderRadius: 9, cursor: "pointer", color: "#8b8f94" }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const fieldLabel = { fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b8f94", marginBottom: 6 };
export const inputStyle = { height: 44, padding: "0 14px", border: "1.5px solid #e8ebee", borderRadius: 10, fontSize: 15, color: "#000", outline: "none", width: "100%" };
