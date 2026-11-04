-- Views remember a scrambled code for the viewer's internet connection (never the address itself),
-- so one shared connection can add only a limited number of counted views per video
-- (Admin → Platform → View counting). Older views have no code and don't count toward the cap.
ALTER TABLE "ViewEvent" ADD COLUMN "networkKey" TEXT;

-- CreateIndex
CREATE INDEX "ViewEvent_videoId_networkKey_createdAt_idx" ON "ViewEvent"("videoId", "networkKey", "createdAt");
