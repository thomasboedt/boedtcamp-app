import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// A driver adapter (instead of Prisma's native query-engine binary) keeps the
// client portable across environments — it works the same way locally and inside
// a Netlify Function, where bundling a platform-specific native binary is fragile.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
