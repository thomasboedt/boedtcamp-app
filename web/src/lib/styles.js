export function seg(active) {
  return {
    padding: "9px 16px",
    border: 0,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .14s",
    background: active ? "linear-gradient(135deg,#2c9dfd,#1f5dc4)" : "transparent",
    color: active ? "#fff" : "#8b8f94",
  };
}

export function segLight(active) {
  return {
    padding: "9px 18px",
    border: 0,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .14s",
    background: active ? "#000" : "transparent",
    color: active ? "#fff" : "#7c8794",
  };
}

export const fmt = (n) => (Math.round((Number(n) || 0) * 10) / 10).toString().replace(".", ",");
