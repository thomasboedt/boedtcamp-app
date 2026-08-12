import serverless from "serverless-http";
import { app } from "../../server/src/app";

// Netlify redirects /api/* to this function (see netlify.toml) while preserving
// the original request path, so the Express app's own /api/* routes still match
// unchanged — same code path as the local dev server in server/src/index.ts.
//
// This is a Netlify Functions v2 (Web-standard Request/Response) handler rather
// than the classic Lambda-callback style: v2 is the only runtime that gets
// access to secret-flagged environment variables (JWT_SECRET, SEED_SECRET,
// TRAINER_PASSWORD, and Netlify Database's own NETLIFY_DB_URL) — classic
// functions only see non-secret env vars in process.env. serverless-http still
// does the Express bridging; we just hand it a synthetic API Gateway HTTP-API
// v2 event built from the incoming Request, and convert its Lambda-style
// response back into a Response.
const expressHandler = serverless(app);

export default async (req: Request) => {
  const url = new URL(req.url);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : "";

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const event = {
    version: "2.0",
    rawPath: url.pathname,
    rawQueryString: url.search.replace(/^\?/, ""),
    headers,
    requestContext: {
      http: {
        method: req.method,
        sourceIp: "0.0.0.0",
      },
    },
    body,
    isBase64Encoded: false,
  };

  const result = (await expressHandler(event, {})) as {
    statusCode: number;
    body: string;
    headers?: Record<string, string | number | boolean | undefined>;
    cookies?: string[];
  };

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(result.headers ?? {})) {
    if (value !== undefined) {
      responseHeaders.set(key, String(value));
    }
  }
  for (const cookie of result.cookies ?? []) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(result.body, {
    status: result.statusCode,
    headers: responseHeaders,
  });
};
