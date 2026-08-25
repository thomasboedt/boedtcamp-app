import { Link } from "react-router-dom";
import Button from "../ds/Button.jsx";

export default function Landing() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 24,
        textAlign: "center",
      }}
    >
      <img src="/lockup-color.svg" alt="BoedtCamp" style={{ height: 64 }} />
      <div>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 30, color: "#000" }}>
          Trainen en Voeding
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/client/login">
          <Button variant="primary" size="lg">
            Ik ben klant
          </Button>
        </Link>
        <Link to="/trainer/login">
          <Button variant="dark" size="lg">
            Ik ben trainer
          </Button>
        </Link>
      </div>
    </div>
  );
}
