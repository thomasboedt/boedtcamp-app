const tones = {
  blue: { background: "rgba(44,157,253,0.12)", color: "var(--bc-blue-700)" },
  dark: { background: "var(--bc-ink)", color: "#fff" },
  outline: { background: "transparent", color: "var(--bc-ink)", border: "1.5px solid var(--bc-gray-300)" },
};

export default function Badge({ tone = "blue", children, style }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 14px",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: "var(--fs-caption)",
        letterSpacing: "var(--ls-wide)",
        textTransform: "uppercase",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
