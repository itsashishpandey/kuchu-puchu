-- One-time unlock: a channel earns for good once it first reaches the monthly-views target (additive)
-- AlterTable
ALTER TABLE "User" ADD COLUMN "monetizationUnlockedAt" DATETIME;


-- creators who were already earning before this rule keep earning (unlocked at their first earning)
UPDATE "User" SET "monetizationUnlockedAt" = (
  SELECT MIN("createdAt") FROM "LedgerEntry" WHERE "LedgerEntry"."userId" = "User"."id" AND "LedgerEntry"."type" IN ('VIEW_EARNING', 'UPLOAD_REWARD')
) WHERE "role" = 'CREATOR' AND EXISTS (
  SELECT 1 FROM "LedgerEntry" WHERE "LedgerEntry"."userId" = "User"."id" AND "LedgerEntry"."type" IN ('VIEW_EARNING', 'UPLOAD_REWARD')
);
