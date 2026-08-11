import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export const TRAINER_COOKIE = "bc_trainer";
export const CLIENT_COOKIE = "bc_client";

type TrainerPayload = { role: "trainer"; trainerId: string };
type ClientPayload = { role: "client"; clientId: string };

export function signTrainerToken(trainerId: string): string {
  const payload: TrainerPayload = { role: "trainer", trainerId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function signClientToken(clientId: string): string {
  const payload: ClientPayload = { role: "client", clientId };
  // long-lived: the client stays logged in on their device until the trainer
  // resets the PIN or the client explicitly logs out.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "180d" });
}

export function verifyTrainerToken(token: string): TrainerPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TrainerPayload;
    if (decoded.role !== "trainer") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyClientToken(token: string): ClientPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ClientPayload;
    if (decoded.role !== "client") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

// pinHash: bcrypt hash, used to verify the pin belongs to this exact client.
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// pinLookup: deterministic sha256 of the plain pin, indexed+unique in the DB.
// This lets login find "which client is this?" in O(1) instead of bcrypt-comparing
// against every client row, while the bcrypt hash above still protects the pin
// itself if the database is ever dumped.
export function pinLookupHash(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function trainerCookieOptions(maxAgeMs: number) {
  return { ...COOKIE_OPTS, maxAge: maxAgeMs };
}

export function clientCookieOptions(maxAgeMs: number) {
  return { ...COOKIE_OPTS, maxAge: maxAgeMs };
}
