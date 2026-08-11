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
      <img src="/lockup-color.svg" alt="BoedtCamp" style={{ height: 40 }} />
      <div>
        <div style={{ fontFamily: "'Exo',sans-serif", fontStyle: "italic", fontWeight: 900, fontSize: 30, color: "#000" }}>
          Krachttraining
        </div>
        <p style={{ color: "#7c8794", fontSize: 14, maxWidth: 360, margin: "8px auto 0" }}>
          Klanten loggen hun training met hun persoonlijke pincode. Trainers volgen alle klanten op via het
          dashboard.
        </p>
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
