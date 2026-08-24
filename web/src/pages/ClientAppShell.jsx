import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import Home from "../components/client/Home.jsx";
import Workout from "../components/client/Workout.jsx";
import Done from "../components/client/Done.jsx";
import Voeding from "../components/client/Voeding.jsx";
import { todayLocal } from "../lib/nutrition.js";

export default function ClientAppShell() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [days, setDays] = useState([]);
  const [history, setHistory] = useState([]);
  const [screen, setScreen] = useState("home");
  const [dayId, setDayId] = useState(null);
  const [session, setSession] = useState(null); // { id, dayTitle, exercises }
  const [doneSummary, setDoneSummary] = useState(null);
  const [foodToday, setFoodToday] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [me, dayList, hist, food] = await Promise.all([api.clientMe(), api.clientDays(), api.clientHistory(), api.food(todayLocal())]);
        setClient(me);
        setDays(dayList);
        setHistory(hist);
        setDayId(dayList[0]?.id || null);
        setFoodToday(food);
      } catch {
        navigate("/client/login", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const refreshHistory = useCallback(async () => {
    setHistory(await api.clientHistory());
  }, []);

  const refreshFoodToday = useCallback(async () => {
    setFoodToday(await api.food(todayLocal()));
  }, []);

  async function startWorkout() {
    if (!dayId) return;
    const started = await api.startSession(dayId);
    const detail = await api.dayExercises(dayId);
    setSession({ id: started.id, day: detail.day, exercises: detail.exercises });
    setScreen("workout");
  }

  function goHome() {
    setScreen("home");
    setSession(null);
    refreshHistory();
    refreshFoodToday();
  }

  async function finishWorkout(summary) {
    setDoneSummary(summary);
    setScreen("done");
  }

  async function logout() {
    await api.clientLogout();
    navigate("/client/login", { replace: true });
  }

  if (loading) return <FullscreenMessage text="Laden…" />;
  if (!client) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f4" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 20px",
          background: "#000",
          color: "#fff",
        }}
      >
        <img src="/lockup-color.svg" alt="BoedtCamp" style={{ height: 24 }} />
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{ padding: "7px 12px", border: "1px solid rgba(255,255,255,.18)", background: "transparent", color: "#c7c9cc", borderRadius: 999, fontSize: 12, cursor: "pointer" }}>
          Afmelden
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 40px" }}>
        {screen === "home" && (
          <Home
            client={client}
            days={days}
            dayId={dayId}
            setDayId={setDayId}
            history={history}
            onStart={startWorkout}
            onFood={() => setScreen("food")}
            foodToday={foodToday}
          />
        )}
        {screen === "workout" && session && (
          <Workout session={session} setSession={setSession} onHome={goHome} onFinish={finishWorkout} />
        )}
        {screen === "done" && (
          <Done summary={doneSummary} sessionId={session?.id} onHome={goHome} />
        )}
        {screen === "food" && <Voeding onHome={goHome} />}
      </div>
    </div>
  );
}

function FullscreenMessage({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8f94" }}>
      {text}
    </div>
  );
}
