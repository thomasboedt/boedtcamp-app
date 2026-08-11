import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import TrainerLogin from "./pages/TrainerLogin.jsx";
import TrainerApp from "./pages/TrainerApp.jsx";
import ClientLogin from "./pages/ClientLogin.jsx";
import ClientAppShell from "./pages/ClientAppShell.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/trainer/login" element={<TrainerLogin />} />
        <Route path="/trainer/*" element={<TrainerApp />} />
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/*" element={<ClientAppShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
