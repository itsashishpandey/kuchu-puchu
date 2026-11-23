import type { Metadata } from "next";
import { App } from "@/components/app/app";
import { db } from "@/lib/db";

// Public channel address: https://mykuchupuchu.com/c/<username>
type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const ch = await db.channel.findUnique({
    where: { username: username.toLowerCase() },
    select: { name: true, tagline: true, description: true, avatarUrl: true, user: { select: { status: true, _count: { select: { videos: { where: { status: "APPROVED" } } } } } } },
  }).catch(() => null);
  if (!ch || ch.user.status !== "APPROVED") return { title: "Channel not found", robots: { index: false } };
  // a channel with no approved videos is an empty page: keep it out of search until it has one
  const empty = ch.user._count.videos === 0;
  const description = (ch.tagline || ch.description || `Watch ${ch.name}'s videos for kids on Kuchu Puchu.`).slice(0, 160);
  const images = ch.avatarUrl ? [{ url: ch.avatarUrl, alt: ch.name }] : undefined;
  return {
    title: ch.name,
    description,
    alternates: { canonical: `/c/${username.toLowerCase()}` },
    openGraph: { title: `${ch.name} · Kuchu Puchu`, description, url: `/c/${username.toLowerCase()}`, type: "profile", images },
    twitter: { card: "summary", title: `${ch.name} · Kuchu Puchu`, description, images: ch.avatarUrl ? [ch.avatarUrl] : undefined },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ChannelPage({ params }: Props) {
  const { username } = await params;
  return <App initialPath={`/c/${username.toLowerCase()}`} />;
}
