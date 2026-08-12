import { getEnvironment } from "@netlify/runtime-utils";

// Temporary diagnostic endpoint.
export default async () => {
  const hasNetlifyGlobal = typeof (globalThis as any).Netlify !== "undefined";
  const env = getEnvironment();
  const netlifyDbUrlPresent = Boolean(env.get("NETLIFY_DB_URL"));
  const jwtSecretPresent = Boolean(process.env.JWT_SECRET);

  let dbQueryResult: string;
  try {
    const { prisma } = await import("../../server/src/db");
    const rows = (await prisma.$queryRaw`SELECT 1 as ok`) as unknown[];
    const trainerCount = await prisma.trainer.count();
    dbQueryResult = `ok, queryRaw=${JSON.stringify(rows)}, trainerCount=${trainerCount}`;
  } catch (e) {
    dbQueryResult = `threw: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`;
  }

  return new Response(
    JSON.stringify(
      { hasNetlifyGlobal, netlifyDbUrlPresent, jwtSecretPresent, dbQueryResult },
      null,
      2
    ),
    { headers: { "content-type": "application/json" } }
  );
};
