import { getConnectionString } from "@netlify/database";

// Temporary diagnostic endpoint to find out why getConnectionString() fails
// at runtime even though the deploy shows a database_branch_id attached.
// Deliberately standalone (no import from server/src) so it can't be taken
// down by the same crash-on-import that a bad DB connection causes elsewhere.
// Only exposes env var *names*, never values.
export const handler = async () => {
  const allEnvKeys = Object.keys(process.env).sort();
  const relevantEnvKeys = allEnvKeys.filter((k) => /DATABASE|NETLIFY_DB|NEON|NETLIFY_/i.test(k));

  let getConnectionStringResult: string;
  try {
    const cs = getConnectionString();
    getConnectionStringResult = cs ? `ok, length=${cs.length}` : "returned empty/falsy value";
  } catch (e) {
    getConnectionStringResult = `threw: ${e instanceof Error ? e.message : String(e)}`;
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ allEnvKeysCount: allEnvKeys.length, relevantEnvKeys, getConnectionStringResult }, null, 2),
  };
};
