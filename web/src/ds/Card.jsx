export default function Card({ dark = false, children, style }) {
  return (
    <div
      style={{
        background: dark ? "var(--surface-card-dark)" : "var(--surface-card)",
        color: dark ? "var(--text-body-inverse)" : "var(--text-body)",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        padding: "var(--space-6)",
        transition: "box-shadow 160ms ease, transform 160ms ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
