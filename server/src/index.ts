import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import clientsRoutes from "./routes/clients";
import programRoutes from "./routes/program";
import libraryRoutes from "./routes/library";
import dashboardRoutes from "./routes/dashboard";
import clientAppRoutes from "./routes/clientApp";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api/trainer", clientsRoutes);
app.use("/api/trainer", programRoutes);
app.use("/api/trainer", libraryRoutes);
app.use("/api/trainer", dashboardRoutes);
app.use("/api/client", clientAppRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Er ging iets mis." });
});

app.listen(PORT, () => {
  console.log(`BoedtCamp API luistert op http://localhost:${PORT}`);
});
