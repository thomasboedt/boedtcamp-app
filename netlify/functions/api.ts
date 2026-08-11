import serverless from "serverless-http";
import { app } from "../../server/src/app";

// Netlify redirects /api/* to this function (see netlify.toml) while preserving
// the original request path, so the Express app's own /api/* routes still match
// unchanged — same code path as the local dev server in server/src/index.ts.
export const handler = serverless(app);
