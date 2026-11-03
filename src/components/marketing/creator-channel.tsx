"use client";

// Public creator channel, YouTube-style: banner, round logo, name, @username, tagline,
// followers · videos, Follow, and Home / Videos / About tabs (About has the support email).
import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { get, post, type FeedVideo } from "@/lib/client";
import { compact, fmtDate, usd } from "@/lib/format";
import { useAuth } from "@/components/app/auth-provider";
import { toast } from "@/hooks/use-toast";
import { VideoGrid } from "@/components/discovery/video-grid";
import { cn } from "@/lib/utils";

type ChannelData = {
  id: string;
  name: string; username: string; description: string; tagline: string;
  avatarUrl: string | null; bannerUrl: string | null; category: string | null; country: string | null;
  socialLinks: Record<string, string | null> | null; followerCount: number;
  verified: boolean; joinedAt: string; showEarnings: boolean; theme?: string;
  verifiedEarnings: number | null; supportEmail: string | null;
  videoCount: number; totalViews: number;
  preferredCategories: { id: string; slug: string; name: string; emoji: string | null }[];
  languages: { code: string; nameEn: string; nameNative: string }[];
  videos: FeedVideo[];
  following: boolean;
};

type Tab = "home" | "videos" | "about";
type Sort = "latest" | "popular" | "oldest";

export function CreatorChannelPage({ username }: { username: string }) {
  // key forces a fresh component instance per creator — no stale state resets needed
  return <ChannelContent key={username} username={username} />;
}

function ChannelContent({ username }: { username: string }) {
  const { user } = useAuth();
  const route = useRoute();
  const [data, setData] = useState<ChannelData | null>(null);
  useEffect(() => { if (data?.name) document.title = `${data.name} | Kuchu Puchu`; }, [data?.name]);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [tab, setTab] = useState<Tab>((route.query.get("tab") as Tab) || "home");
  const [sort, setSort] = useState<Sort>("latest");
  const [sorted, setSorted] = useState<FeedVideo[] | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    let alive = true;
    get<{ channel: ChannelData }>(`/public/creator/${username}`)
      .then(d => { if (!alive) return; setData(d.channel); setFollowing(d.channel.following); setFollowers(d.channel.followerCount); })
      .catch(e => { if (alive) setError((e as Error).message); });
    return () => { alive = false; };
  }, [username]);

  useEffect(() => {
    if (sort === "latest") { setSorted(null); return; }
    get<{ channel: ChannelData }>(`/public/creator/${username}?sort=${sort}`).then(d => setSorted(d.channel.videos)).catch(() => {});
  }, [sort, username]);

  const go = (t: Tab) => { setTab(t); navigate(`/c/${username}${t === "home" ? "" : `?tab=${t}`}`, { replace: true }); };
  const isOwner = !!user && !!data && user.channel?.id === data.id;

  const toggleFollow = async () => {
    if (!data) return;
    if (!user) { toast({ title: "Log in to follow", description: "Create a free account to follow creators." }); navigate("/join"); return; }
    try {
      const res = await post<{ following: boolean; followerCount: number }>(`/social/follow/${data.id}`, { channelId: data.id });
      setFollowing(res.following); setFollowers(res.followerCount);
      toast({ title: res.following ? `Following ${data.name}` : `Unfollowed ${data.name}` });
    } catch (e) {
      toast({ title: "Couldn't follow", description: (e as Error).message, variant: "destructive" });
    }
  };

  const shareChannel = async () => {
    const url = `${window.location.origin}/c/${username}`;
    try {
      if (navigator.share) await navigator.share({ title: data?.name, text: `${data?.name} on Kuchu Puchu`, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Channel link copied" }); }
    } catch { /* dismissed */ }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-40 text-center">
        <EmptyState icon="UserX" title="Channel not found" description={error} action={{ label: "Explore videos", onClick: () => navigate("/explore") }} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 md:px-6">
        <div className="shimmer aspect-[4/1] rounded-2xl md:aspect-[6.2/1]" />
        <div className="mt-6 flex items-center gap-5"><div className="shimmer h-24 w-24 rounded-full md:h-36 md:w-36" /><div className="shimmer h-16 flex-1 rounded-xl" /></div>
      </div>
    );
  }

  const socials = Object.entries(data.socialLinks ?? {}).filter(([, v]) => !!v) as [string, string][];
  const pink = data.theme === "PINK";
  const latest = data.videos;
  const popular = [...data.videos].sort((a, b) => b.views - a.views);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-20 md:px-6 md:pt-24">
      {/* banner */}
      <div className="relative aspect-[4/1] overflow-hidden rounded-2xl md:aspect-[6.2/1]"
        style={!data.bannerUrl ? { background: pink ? "linear-gradient(120deg,#FF4E9B,#FFC531)" : "linear-gradient(120deg,#1677FF,#FF4E9B)" } : undefined}>
        {data.bannerUrl
          ? <img src={data.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-30 md:text-5xl" aria-hidden>✨ 🎈 ⭐ 🎵 🌈</div>}
      </div>

      {/* header */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="hidden shrink-0 sm:block"><Avatar src={data.avatarUrl} name={data.name} size={128} className="shadow-lg ring-4 ring-white" /></div>
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="shrink-0 sm:hidden"><Avatar src={data.avatarUrl} name={data.name} size={72} className="shadow ring-2 ring-white" /></div>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold leading-tight md:text-4xl">
              <span className="truncate">{data.name}</span>
              {data.verified && <Icons.BadgeCheck size={22} className="shrink-0 text-brand-blue" aria-label="Verified" />}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">@{data.username}</span>
              <span> · {compact(followers)} follower{followers === 1 ? "" : "s"} · {data.videoCount} video{data.videoCount === 1 ? "" : "s"}</span>
            </p>
            {(data.tagline || data.description) && (
              <button onClick={() => go("about")} className="mt-1.5 line-clamp-1 max-w-2xl text-left text-sm text-muted-foreground hover:text-foreground">
                {data.tagline || data.description} <span className="font-semibold text-foreground">›</span>
              </button>
            )}
            {socials.length > 0 && (
              <p className="mt-1 text-sm font-semibold text-brand-blue">
                {linkLabel(socials[0])}{socials.length > 1 && <span className="text-muted-foreground"> and {socials.length - 1} more link{socials.length > 2 ? "s" : ""}</span>}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <Button className="rounded-full" onClick={() => navigate("/dashboard/channel")}><Icons.Pencil size={15} className="mr-1.5" /> Customize channel</Button>
                  <Button variant="outline" className="rounded-full" onClick={() => navigate("/dashboard/followers")}><Icons.Users size={15} className="mr-1.5" /> My followers</Button>
                </>
              ) : (
                <Button onClick={toggleFollow}
                  className={cn("rounded-full px-6 font-bold", following ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-ink text-white hover:bg-ink/85")}>
                  {following ? <><Icons.BellRing size={15} className="mr-1.5" /> Following</> : "Follow"}
                </Button>
              )}
              <Button variant="outline" className="rounded-full" onClick={shareChannel}><Icons.Share2 size={15} className="mr-1.5" /> Share</Button>
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="sticky top-16 z-20 mt-6 border-b bg-background/95 backdrop-blur" role="tablist">
        <div className="flex gap-6">
          {(["home", "videos", "about"] as Tab[]).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => go(t)}
              className={cn("border-b-2 px-1 py-3 text-sm font-bold capitalize transition", tab === t ? "border-ink text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "home" && (
        <div className="mt-6 space-y-10">
          {data.videos.length === 0 ? (
            <EmptyState icon="Video" title="No videos yet" description="This channel hasn't published any videos yet." />
          ) : (
            <>
              <Shelf title="Latest videos" videos={latest} onAll={() => { setSort("latest"); go("videos"); }} />
              {data.videos.length > 3 && <Shelf title="Popular" videos={popular} onAll={() => { setSort("popular"); go("videos"); }} />}
            </>
          )}
          {data.preferredCategories.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg font-bold">What this channel makes</h2>
              <div className="flex flex-wrap gap-2">
                {data.preferredCategories.map(c => (
                  <button key={c.id} onClick={() => navigate(`/explore?category=${c.slug}`)} className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold hover:bg-secondary/70">
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "videos" && (
        <div className="mt-5">
          <div className="mb-4 flex gap-2">
            {(["latest", "popular", "oldest"] as Sort[]).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition", sort === s ? "bg-ink text-white" : "bg-secondary hover:bg-secondary/70")}>
                {s}
              </button>
            ))}
          </div>
          {data.videos.length === 0
            ? <EmptyState icon="Video" title="No videos yet" description="This channel hasn't published any videos yet." />
            : <VideoGrid videos={sort === "latest" ? latest : sorted ?? []} loading={sort !== "latest" && !sorted} />}
        </div>
      )}

      {tab === "about" && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
              <h2 className="font-display text-lg font-bold">About</h2>
              {data.tagline && <p className="mt-2 font-semibold">{data.tagline}</p>}
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.description || "This creator hasn't written a channel description yet."}</p>
            </section>
            {socials.length > 0 && (
              <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
                <h2 className="font-display text-lg font-bold">Links</h2>
                <ul className="mt-3 space-y-2.5">
                  {socials.map(s => {
                    const href = linkHref(s);
                    return (
                      <li key={s[0]} className="flex items-center gap-3 text-sm">
                        <SocialIcon kind={s[0]} />
                        <span className="w-20 capitalize text-muted-foreground">{s[0] === "x" ? "X" : s[0]}</span>
                        {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="truncate font-semibold text-brand-blue hover:underline">{linkLabel(s)}</a> : <span className="truncate font-semibold">{linkLabel(s)}</span>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
          <aside className="space-y-5">
            <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
              <h2 className="font-display text-lg font-bold">Channel details</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {data.supportEmail && (
                  <li className="flex items-start gap-3">
                    <Icons.Mail size={17} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">Support &amp; business enquiries</span>
                      {showEmail
                        ? <a href={`mailto:${data.supportEmail}`} className="break-all font-semibold text-brand-blue hover:underline">{data.supportEmail}</a>
                        : <button onClick={() => setShowEmail(true)} className="font-semibold text-brand-blue hover:underline">View email address</button>}
                    </span>
                  </li>
                )}
                <Detail icon="AtSign" text={`mykuchupuchu.com/c/${data.username}`} />
                <Detail icon="Users" text={`${followers.toLocaleString()} follower${followers === 1 ? "" : "s"}`} />
                <Detail icon="PlaySquare" text={`${data.videoCount} video${data.videoCount === 1 ? "" : "s"}`} />
                <Detail icon="TrendingUp" text={`${data.totalViews.toLocaleString()} views`} />
                <Detail icon="Info" text={`Joined ${fmtDate(data.joinedAt)}`} />
                {data.country && <Detail icon="Globe2" text={data.country} />}
                {data.languages.length > 0 && <Detail icon="Languages" text={data.languages.map(l => l.nameNative !== l.nameEn ? `${l.nameNative} (${l.nameEn})` : l.nameEn).join(", ")} />}
              </ul>
            </section>
            {data.showEarnings && data.verifiedEarnings !== null && (
              <section className="rounded-2xl bg-ink p-6 text-white">
                <p className="text-xs uppercase tracking-wider text-white/50">Verified lifetime earnings</p>
                <p className="mt-1 font-display text-3xl font-bold text-brand-yellow">{usd(data.verifiedEarnings)}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/55">From Kuchu Puchu's earnings ledger, shown with this creator's consent.</p>
              </section>
            )}
            <button onClick={() => navigate("/contact")} className="flex items-center gap-2 px-1 text-sm text-muted-foreground hover:text-foreground">
              <Icons.Flag size={15} /> Report this channel
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Shelf({ title, videos, onAll }: { title: string; videos: FeedVideo[]; onAll: () => void }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <button onClick={onAll} className="text-sm font-semibold text-brand-blue hover:underline">See all</button>
      </div>
      <VideoGrid videos={videos.slice(0, 4)} />
    </section>
  );
}

function Detail({ icon, text }: { icon: keyof typeof Icons; text: string }) {
  const Icon = Icons[icon] as React.ComponentType<{ size?: number; className?: string }>;
  return <li className="flex items-start gap-3"><Icon size={17} className="mt-0.5 shrink-0 text-muted-foreground" /><span className="min-w-0 break-words">{text}</span></li>;
}

function SocialIcon({ kind }: { kind: string }) {
  const Icon = kind === "instagram" ? Icons.Instagram : kind === "youtube" ? Icons.Youtube : kind === "x" ? Icons.Twitter : Icons.Globe;
  return <Icon size={17} className="shrink-0 text-muted-foreground" />;
}

function linkLabel([kind, v]: [string, string]) {
  if (kind === "instagram" || kind === "x") return `@${v.replace(/^@/, "")}`;
  return v.replace(/^https?:\/\//, "");
}

function linkHref([kind, v]: [string, string]): string | null {
  const clean = v.replace(/^@/, "").trim();
  if (!clean) return null;
  if (kind === "instagram") return `https://instagram.com/${encodeURIComponent(clean)}`;
  if (kind === "x") return `https://x.com/${encodeURIComponent(clean)}`;
  if (/^https?:\/\//.test(clean)) return clean;
  if (kind === "youtube" || kind === "website") return `https://${clean}`;
  return null;
}
