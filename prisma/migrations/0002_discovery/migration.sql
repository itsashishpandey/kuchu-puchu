-- AlterTable
ALTER TABLE "ViewEvent" ADD COLUMN "country" TEXT;
ALTER TABLE "ViewEvent" ADD COLUMN "durationSeconds" REAL;
ALTER TABLE "ViewEvent" ADD COLUMN "userId" TEXT;

-- AlterTable
ALTER TABLE "ContentReport" ADD COLUMN "userId" TEXT;

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emoji" TEXT,
    "description" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retiredAt" DATETIME,
    "mergedIntoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locale" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategoryTranslation_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "iso6391" TEXT,
    "iso6393" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNative" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'LTR',
    "region" TEXT,
    "group" TEXT NOT NULL DEFAULT 'INTERNATIONAL',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VideoLanguage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'CREATOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoLanguage_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    -- hand-added: 1 primary + at most 2 additional languages per video (with unique videoId+position)
    CONSTRAINT "VideoLanguage_position_check" CHECK ("position" BETWEEN 1 AND 3),
    CONSTRAINT "VideoLanguage_primary_check" CHECK (("position" = 1) = ("isPrimary" = 1))
);

-- CreateTable
CREATE TABLE "VideoCategoryAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CREATOR',
    "assignedById" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoCategoryAssignment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VideoCategoryAssignment_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    -- hand-added: at most 3 distinct main categories per video (with unique videoId+priority / videoId+categoryId)
    CONSTRAINT "VideoCategoryAssignment_priority_check" CHECK ("priority" BETWEEN 1 AND 3)
);

-- CreateTable
CREATE TABLE "UserLanguagePreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserLanguagePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserLanguagePreference_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCategoryPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "allSubcategories" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCategoryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCategoryPreference_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSubcategoryPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSubcategoryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSubcategoryPreference_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRecommendationPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "discoverOtherLanguages" BOOLEAN NOT NULL DEFAULT false,
    "interfaceLocale" TEXT NOT NULL DEFAULT 'en',
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingDraft" TEXT,
    "onboardingCompletedAt" DATETIME,
    "learnedResetAt" DATETIME,
    "prefsVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRecommendationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'NOT_INTERESTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoFeedback_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockedCreator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedCreator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlockedCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoInteractionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "userId" TEXT,
    "viewerKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "watchSeconds" REAL,
    "completion" REAL,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoInteractionEvent_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChannelCategoryPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChannelCategoryPreference_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChannelCategoryPreference_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChannelLanguage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChannelLanguage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChannelLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ARCHIVED',
    "settings" TEXT NOT NULL,
    "experimentPercent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdByEmail" TEXT,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TaxonomyAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" TEXT,
    "after" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "interpreted" TEXT,
    "resultCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL DEFAULT '[]',
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" REAL NOT NULL,
    "fileSizeMB" REAL NOT NULL DEFAULT 0,
    "resolution" TEXT NOT NULL DEFAULT '720x1280',
    "format" TEXT NOT NULL DEFAULT 'mp4',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "sha256" TEXT,
    "visualHash" TEXT,
    "audioHash" TEXT,
    "duplicateOfId" TEXT,
    "similarityScore" REAL,
    "duplicateStatus" TEXT,
    "uploadRewardCredited" BOOLEAN NOT NULL DEFAULT false,
    "monetizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "earningExpiresAt" DATETIME,
    "publishedAt" DATETIME,
    "views" INTEGER NOT NULL DEFAULT 0,
    "qualifiedViews" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tagStatus" TEXT NOT NULL DEFAULT 'OK',
    "tagFlagReason" TEXT,
    "tagSuggestions" TEXT,
    "tagsUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Channel" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("audioHash", "category", "commentsCount", "contentId", "createdAt", "creatorId", "description", "duplicateOfId", "duplicateStatus", "duration", "earningExpiresAt", "featured", "fileSizeMB", "format", "hashtags", "id", "likes", "monetizationEnabled", "publishedAt", "qualifiedViews", "rejectionReason", "resolution", "sha256", "shares", "similarityScore", "status", "thumbnailUrl", "title", "updatedAt", "uploadRewardCredited", "videoUrl", "views", "visualHash") SELECT "audioHash", "category", "commentsCount", "contentId", "createdAt", "creatorId", "description", "duplicateOfId", "duplicateStatus", "duration", "earningExpiresAt", "featured", "fileSizeMB", "format", "hashtags", "id", "likes", "monetizationEnabled", "publishedAt", "qualifiedViews", "rejectionReason", "resolution", "sha256", "shares", "similarityScore", "status", "thumbnailUrl", "title", "updatedAt", "uploadRewardCredited", "videoUrl", "views", "visualHash" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_contentId_key" ON "Video"("contentId");
CREATE INDEX "Video_status_publishedAt_idx" ON "Video"("status", "publishedAt");
CREATE INDEX "Video_creatorId_idx" ON "Video"("creatorId");
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "emoji" TEXT,
    "color" TEXT,
    "coverImageUrl" TEXT,
    "description" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retiredAt" DATETIME,
    "mergedIntoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Category" ("active", "description", "icon", "id", "name", "slug") SELECT "active", "description", "icon", "id", "name", "slug" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_active_sortOrder_idx" ON "Category"("active", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Subcategory_active_idx" ON "Subcategory"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_slug_key" ON "Subcategory"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_locale_categoryId_key" ON "CategoryTranslation"("locale", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_locale_subcategoryId_key" ON "CategoryTranslation"("locale", "subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE INDEX "Language_active_priority_idx" ON "Language"("active", "priority");

-- CreateIndex
CREATE INDEX "VideoLanguage_languageId_isPrimary_idx" ON "VideoLanguage"("languageId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "VideoLanguage_videoId_languageId_key" ON "VideoLanguage"("videoId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoLanguage_videoId_position_key" ON "VideoLanguage"("videoId", "position");

-- CreateIndex
CREATE INDEX "VideoCategoryAssignment_categoryId_idx" ON "VideoCategoryAssignment"("categoryId");

-- CreateIndex
CREATE INDEX "VideoCategoryAssignment_subcategoryId_idx" ON "VideoCategoryAssignment"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCategoryAssignment_videoId_categoryId_key" ON "VideoCategoryAssignment"("videoId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCategoryAssignment_videoId_priority_key" ON "VideoCategoryAssignment"("videoId", "priority");

-- CreateIndex
CREATE INDEX "UserLanguagePreference_languageId_idx" ON "UserLanguagePreference"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLanguagePreference_userId_languageId_key" ON "UserLanguagePreference"("userId", "languageId");

-- CreateIndex
CREATE INDEX "UserCategoryPreference_categoryId_idx" ON "UserCategoryPreference"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCategoryPreference_userId_categoryId_key" ON "UserCategoryPreference"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "UserSubcategoryPreference_subcategoryId_idx" ON "UserSubcategoryPreference"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubcategoryPreference_userId_subcategoryId_key" ON "UserSubcategoryPreference"("userId", "subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVideo_userId_videoId_key" ON "SavedVideo"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoFeedback_userId_videoId_kind_key" ON "VideoFeedback"("userId", "videoId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedCreator_userId_creatorId_key" ON "BlockedCreator"("userId", "creatorId");

-- CreateIndex
CREATE INDEX "VideoInteractionEvent_userId_createdAt_idx" ON "VideoInteractionEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoInteractionEvent_videoId_type_idx" ON "VideoInteractionEvent"("videoId", "type");

-- CreateIndex
CREATE INDEX "VideoInteractionEvent_createdAt_idx" ON "VideoInteractionEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelCategoryPreference_channelId_categoryId_key" ON "ChannelCategoryPreference"("channelId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelLanguage_channelId_languageId_key" ON "ChannelLanguage"("channelId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationConfig_version_key" ON "RecommendationConfig"("version");

-- CreateIndex
CREATE INDEX "TaxonomyAuditLog_entityType_entityId_idx" ON "TaxonomyAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TaxonomyAuditLog_createdAt_idx" ON "TaxonomyAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SearchLog_normalized_idx" ON "SearchLog"("normalized");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "ViewEvent_userId_createdAt_idx" ON "ViewEvent"("userId", "createdAt");


-- Hand-added integrity triggers: a video's subcategory must belong to the assigned main category.
CREATE TRIGGER "VideoCategoryAssignment_parent_check_insert"
BEFORE INSERT ON "VideoCategoryAssignment"
WHEN (SELECT "categoryId" FROM "Subcategory" WHERE "id" = NEW."subcategoryId") IS NOT NEW."categoryId"
BEGIN
    SELECT RAISE(ABORT, 'subcategory does not belong to category');
END;

CREATE TRIGGER "VideoCategoryAssignment_parent_check_update"
BEFORE UPDATE OF "categoryId", "subcategoryId" ON "VideoCategoryAssignment"
WHEN (SELECT "categoryId" FROM "Subcategory" WHERE "id" = NEW."subcategoryId") IS NOT NEW."categoryId"
BEGIN
    SELECT RAISE(ABORT, 'subcategory does not belong to category');
END;
