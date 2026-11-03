-- Upload reward in INR (₹30 default) converted to USD at an admin-set rate; 2,500 monthly channel views to earn.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonetizationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ratePer1000Views" REAL NOT NULL DEFAULT 1.0,
    "rewardPerUpload" REAL NOT NULL DEFAULT 0.32,
    "rewardPerUploadInr" REAL NOT NULL DEFAULT 30,
    "inrPerUsd" REAL NOT NULL DEFAULT 95,
    "minMonthlyChannelViews" INTEGER NOT NULL DEFAULT 2500,
    "monetizationDurationMonths" INTEGER NOT NULL DEFAULT 4,
    "minWithdrawalAmount" REAL NOT NULL DEFAULT 25.0,
    "holdingPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "monetizationPaused" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MonetizationSetting" ("active", "createdAt", "createdBy", "effectiveDate", "holdingPeriodDays", "id", "minWithdrawalAmount", "monetizationDurationMonths", "monetizationPaused", "ratePer1000Views", "rewardPerUpload") SELECT "active", "createdAt", "createdBy", "effectiveDate", "holdingPeriodDays", "id", "minWithdrawalAmount", "monetizationDurationMonths", "monetizationPaused", "ratePer1000Views", "rewardPerUpload" FROM "MonetizationSetting";
DROP TABLE "MonetizationSetting";
ALTER TABLE "new_MonetizationSetting" RENAME TO "MonetizationSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- data: earlier settings rows keep their USD reward (INR shown at the default rate);
-- the current settings row becomes ₹30 at ₹95 = $1
UPDATE "MonetizationSetting" SET "rewardPerUploadInr" = ROUND("rewardPerUpload" * 95, 2);
UPDATE "MonetizationSetting" SET "rewardPerUploadInr" = 30, "inrPerUsd" = 95, "rewardPerUpload" = ROUND(30.0 / 95, 2)
WHERE "id" = (SELECT "id" FROM "MonetizationSetting" ORDER BY "effectiveDate" DESC, "createdAt" DESC LIMIT 1);
