import { getEnvironment } from "@netlify/runtime-utils";

// Temporary diagnostic endpoint. @netlify/database's getConnectionString()
// reads the key "NETLIFY_DB_URL" via getEnvironment(), which prefers the
// globalThis.Netlify.env binding (Function-runtime-only, not in process.env)
// and falls back to process.env. This checks both sources directly.
export const handler = async () => {
  const hasNetlifyGlobal = typeof (globalThis as any).Netlify !== "undefined";
  const env = getEnvironment();
  const fromGetEnvironment = env.get("NETLIFY_DB_URL");
  const fromProcessEnv = process.env.NETLIFY_DB_URL;

  const allProcessEnvKeys = Object.keys(process.env).sort();

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      {
        hasNetlifyGlobal,
        netlifyDbUrlViaGetEnvironment: fromGetEnvironment ? `present, length=${fromGetEnvironment.length}` : "missing",
        netlifyDbUrlViaProcessEnv: fromProcessEnv ? `present, length=${fromProcessEnv.length}` : "missing",
        allProcessEnvKeysCount: allProcessEnvKeys.length,
        allProcessEnvKeys,
      },
      null,
      2
    ),
  };
};
