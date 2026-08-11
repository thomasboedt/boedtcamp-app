import { NextFunction, Request, Response } from "express";
import { CLIENT_COOKIE, TRAINER_COOKIE, verifyClientToken, verifyTrainerToken } from "../auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      trainerId?: string;
      clientId?: string;
    }
  }
}

export function requireTrainer(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[TRAINER_COOKIE];
  const decoded = token && verifyTrainerToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Niet ingelogd als trainer." });
    return;
  }
  req.trainerId = decoded.trainerId;
  next();
}

export function requireClient(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[CLIENT_COOKIE];
  const decoded = token && verifyClientToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Niet ingelogd. Voer je pincode in." });
    return;
  }
  req.clientId = decoded.clientId;
  next();
}
