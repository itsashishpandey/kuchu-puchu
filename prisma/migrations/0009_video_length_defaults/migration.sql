-- Video length limits: owner's defaults are 20–90 seconds (admins can change them on Admin → Platform).
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UploadRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "minDurationSec" INTEGER NOT NULL DEFAULT 20,
    "maxDurationSec" INTEGER NOT NULL DEFAULT 90,
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 200,
    "maxResolution" TEXT NOT NULL DEFAULT '1080p',
    "formats" TEXT NOT NULL DEFAULT 'mp4,mov',
    "maxDailyUploads" INTEGER NOT NULL DEFAULT 2,
    "maxWeeklyUploads" INTEGER NOT NULL DEFAULT 4,
    "requireVideoApproval" BOOLEAN NOT NULL DEFAULT true,
    "rewardRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UploadRule" ("formats", "id", "maxDailyUploads", "maxDurationSec", "maxFileSizeMB", "maxResolution", "maxWeeklyUploads", "minDurationSec", "requireVideoApproval", "rewardRequiresApproval", "updatedAt") SELECT "formats", "id", "maxDailyUploads", "maxDurationSec", "maxFileSizeMB", "maxResolution", "maxWeeklyUploads", "minDurationSec", "requireVideoApproval", "rewardRequiresApproval", "updatedAt" FROM "UploadRule";
DROP TABLE "UploadRule";
ALTER TABLE "new_UploadRule" RENAME TO "UploadRule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- apply the new defaults to the existing rules row
UPDATE "UploadRule" SET "minDurationSec" = 20, "maxDurationSec" = 90;
