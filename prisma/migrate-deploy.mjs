// Bring an existing database up to date without losing data:
//   1. A database created before versioned migrations existed (tables present, no record of
//      0001_baseline) gets the baseline marked as applied — nothing is re-run or dropped.
//   2. `prisma migrate deploy` applies newer migrations in order (all additive).
//   3. The discovery seed + controlled video backfill run (idempotent: they only add what's missing).
// Usage:  node prisma/migrate-deploy.mjs        (uses DATABASE_URL / .env, like the app)
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { seedDiscovery, applyKidsTaxonomy, backfillVideoTags } from "./seed-discovery.mjs";

const run = cmd => execSync(cmd, { stdio: "inherit" });

async function baselineState() {
  const db = new PrismaClient();
  try {
    const tables = new Set((await db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type = 'table'")).map(t => t.name));
    if (!tables.has("_prisma_migrations")) return { hasTables: tables.has("Video"), baselined: false };
    const rows = await db.$queryRawUnsafe("SELECT migration_name FROM _prisma_migrations WHERE migration_name = '0001_baseline' AND finished_at IS NOT NULL");
    return { hasTables: tables.has("Video"), baselined: rows.length > 0 };
  } finally {
    await db.$disconnect();
  }
}

const state = await baselineState();
if (state.hasTables && !state.baselined) {
  console.log("• existing database without migration history → recording 0001_baseline as applied");
  run("npx prisma migrate resolve --applied 0001_baseline");
}
run("npx prisma migrate deploy");

const db = new PrismaClient();
try {
  await seedDiscovery(db);
  await applyKidsTaxonomy(db);
  await backfillVideoTags(db);
} finally {
  await db.$disconnect();
}
console.log("✔ database is up to date");
