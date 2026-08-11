import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import clientsRoutes from "./routes/clients";
import programRoutes from "./routes/program";
import libraryRoutes from "./routes/library";
import dashboardRoutes from "./routes/dashboard";
import clientAppRoutes from "./routes/clientApp";
import adminRoutes from "./routes/admin";

export const app = express();

// In production, frontend + API are served from the same Netlify site (the API
// reached via a same-origin /api/* redirect to a function), so cross-origin
// requests only happen in local dev against the Vite dev server.
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api/trainer", clientsRoutes);
app.use("/api/trainer", programRoutes);
app.use("/api/trainer", libraryRoutes);
app.use("/api/trainer", dashboardRoutes);
app.use("/api/client", clientAppRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Er ging iets mis." });
});
