// Channel strikes: each upheld complaint is one strike. At STRIKE_LIMIT active strikes the channel
// is suspended automatically; deleting it stays a deliberate admin decision.
import { db } from "@/lib/db";
import { notify, audit } from "@/lib/platform";
import { STRIKE_LIMIT } from "@/lib/creator-application";

type Actor = { id: string; email: string };

export async function addStrike(opts: { userId: string; reason: string; contentId?: string | null; reportId?: string | null; actor: Actor }) {
  const strike = await db.channelStrike.create({
    data: {
      userId: opts.userId, reason: opts.reason.slice(0, 500), contentId: opts.contentId ?? null, reportId: opts.reportId ?? null,
      createdById: opts.actor.id, createdByEmail: opts.actor.email,
    },
  });
  const active = await db.channelStrike.count({ where: { userId: opts.userId, revokedAt: null } });
  const user = await db.user.findUnique({ where: { id: opts.userId }, include: { channel: true } });
  await audit({ actorId: opts.actor.id, actorEmail: opts.actor.email, action: "CHANNEL_STRIKE_ADDED", targetType: "CREATOR", targetId: user?.channel?.username ?? opts.userId, details: `${active}/${STRIKE_LIMIT}: ${opts.reason}` });

  let suspended = false;
  if (active >= STRIKE_LIMIT && user && user.status !== "SUSPENDED") {
    await db.user.update({ where: { id: user.id }, data: { status: "SUSPENDED", suspensionReason: `${STRIKE_LIMIT} upheld complaints (strikes). The channel is under review for deletion.` } });
    await db.session.deleteMany({ where: { userId: user.id } });
    suspended = true;
    await audit({ actorId: opts.actor.id, actorEmail: opts.actor.email, action: "CREATOR_SUSPENDED", targetType: "CREATOR", targetId: user.channel?.username ?? user.id, details: `Automatic: ${STRIKE_LIMIT} active strikes` });
  }
  await notify({
    userId: opts.userId, type: "WARNING",
    title: suspended ? "Channel suspended — 3 strikes" : `Strike ${active} of ${STRIKE_LIMIT} on your channel`,
    body: suspended
      ? `Your channel reached ${STRIKE_LIMIT} strikes and has been suspended. It may be permanently deleted. Latest reason: ${opts.reason}. Contact support@mykuchupuchu.com to appeal.`
      : `A complaint about your content was upheld${opts.contentId ? ` (${opts.contentId})` : ""}: ${opts.reason}. ${STRIKE_LIMIT - active} more strike${STRIKE_LIMIT - active === 1 ? "" : "s"} will suspend your channel.`,
    link: "#/dashboard",
    email: user ? { to: user.email, subject: suspended ? "Your Kuchu Puchu channel is suspended" : `Strike ${active} of ${STRIKE_LIMIT} on your channel`, body: opts.reason } : undefined,
  });
  return { strike, active, suspended };
}

export async function revokeStrike(strikeId: string, note: string, actor: Actor) {
  const s = await db.channelStrike.findUnique({ where: { id: strikeId } });
  if (!s || s.revokedAt) return null;
  await db.channelStrike.update({ where: { id: s.id }, data: { revokedAt: new Date(), revokedById: actor.id, revokeNote: note.slice(0, 300) || null } });
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "CHANNEL_STRIKE_REVOKED", targetType: "CREATOR", targetId: s.userId, details: note || s.reason });
  await notify({ userId: s.userId, type: "ACCOUNT_STATUS", title: "A strike was removed from your channel", body: note ? `Note from our team: ${note}` : "After review, one strike was removed.", link: "#/dashboard" });
  return s;
}
