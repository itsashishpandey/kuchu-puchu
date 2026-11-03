// Recommendation signals (data-minimized: no IP, no text; viewerKey is already a one-way hash).
import { db } from "@/lib/db";

export type InteractionType = "VIEW" | "COMPLETE" | "LIKE" | "UNLIKE" | "SAVE" | "UNSAVE" | "SHARE" | "NOT_INTERESTED" | "HIDE_CREATOR" | "REPORT";
const RETENTION_DAYS = 180;

export async function recordInteraction(e: {
  videoId: string; userId: string | null; viewerKey: string; type: InteractionType;
  watchSeconds?: number | null; completion?: number | null; suspicious?: boolean;
}) {
  await db.videoInteractionEvent.create({
    data: {
      videoId: e.videoId, userId: e.userId, viewerKey: e.viewerKey, type: e.type,
      watchSeconds: e.watchSeconds ?? null, completion: e.completion ?? null, suspicious: !!e.suspicious,
    },
  }).catch(() => {});
  // occasional pruning keeps the table bounded without a cron job
  if (Math.random() < 0.005) {
    db.videoInteractionEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * 864e5) } } }).catch(() => {});
  }
}
