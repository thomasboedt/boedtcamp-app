import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getConnectionString } from "@netlify/database";

// A driver adapter (instead of Prisma's native query-engine binary) keeps the
// client portable across environments — it works the same way locally and inside
// a Netlify Function, where bundling a platform-specific native binary is fragile.
//
// Locally, DATABASE_URL (server/.env) points at a plain Postgres instance. On
// Netlify, no DATABASE_URL is set — getConnectionString() resolves the URL for
// the automatically provisioned Netlify DB (Postgres), branch-aware.
const connectionString = process.env.DATABASE_URL || getConnectionString();
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
