-- YouTube-style channel header + follower privacy (additive)
ALTER TABLE "Channel" ADD COLUMN "tagline" TEXT;
ALTER TABLE "Channel" ADD COLUMN "supportEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "followsPrivate" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Follow_channelId_createdAt_idx" ON "Follow"("channelId", "createdAt");
