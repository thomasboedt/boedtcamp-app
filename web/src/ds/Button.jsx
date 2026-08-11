const sizeStyles = {
  md: { padding: "12px 24px", fontSize: "var(--fs-body)" },
  lg: { padding: "16px 32px", fontSize: "var(--fs-body-lg)" },
};

export default function Button({ variant = "primary", size = "md", disabled = false, children, onClick, style, type = "button" }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    borderRadius: "var(--radius-pill)",
    border: "2px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 120ms ease, filter 120ms ease, background 120ms ease",
    ...sizeStyles[size],
  };
  const variants = {
    primary: { background: "var(--color-brand-primary-gradient)", color: "#fff", boxShadow: "0 6px 16px rgba(31,93,196,0.35)" },
    dark: { background: "var(--bc-ink)", color: "#fff", borderColor: "var(--bc-ink)" },
    secondary: { background: "transparent", color: "var(--bc-blue-700)", borderColor: "var(--bc-blue-500)" },
    ghost: { background: "transparent", color: "var(--text-heading)", borderColor: "transparent" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(1.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}
