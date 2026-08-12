import { getEnvironment } from "@netlify/runtime-utils";

// Temporary diagnostic endpoint (v2 function format) to confirm secret env
// vars and NETLIFY_DB_URL become visible once the runtime is v2.
export default async () => {
  const hasNetlifyGlobal = typeof (globalThis as any).Netlify !== "undefined";
  const env = getEnvironment();
  const fromGetEnvironment = env.get("NETLIFY_DB_URL");
  const fromProcessEnv = process.env.NETLIFY_DB_URL;
  const jwtSecretPresent = Boolean(process.env.JWT_SECRET) || Boolean(env.get("JWT_SECRET"));

  return new Response(
    JSON.stringify(
      {
        hasNetlifyGlobal,
        netlifyDbUrlViaGetEnvironment: fromGetEnvironment ? `present, length=${fromGetEnvironment.length}` : "missing",
        netlifyDbUrlViaProcessEnv: fromProcessEnv ? `present, length=${fromProcessEnv.length}` : "missing",
        jwtSecretPresent,
      },
      null,
      2
    ),
    { headers: { "content-type": "application/json" } }
  );
};
