"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, StatusBadge, EmptyState, CategoryIcon } from "@/components/shared/ui-bits";
import { navigate, Link } from "@/components/app/router";
import { get, post } from "@/lib/client";
import { compact, fmtDate, timeAgo, usd } from "@/lib/format";
import { useAuth } from "@/components/app/auth-provider";
import { toast } from "@/hooks/use-toast";

type ChannelData = {
  id: string;
  name: string; username: string; description: string;
  avatarUrl: string | null; category: string | null; country: string | null;
  socialLinks: Record<string, string> | null; followerCount: number;
  verified: boolean; joinedAt: string; showEarnings: boolean;
  verifiedEarnings: number | null;
  videos: {
    id: string; contentId: string; title: string; thumbnailUrl: string | null;
    videoUrl: string; duration: number; views: number; likes: number;
    category: string; publishedAt: string | null;
  }[];
  following: boolean;
};

export function CreatorChannelPage({ username }: { username: string }) {
  // key forces a fresh component instance per creator — no stale state resets needed
  return <ChannelContent key={username} username={username} />;
}

function ChannelContent({ username }: { username: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ChannelData | null>(null);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    let alive = true;
    get<{ channel: ChannelData }>(`/public/creator/${username}`)
      .then(d => {
        if (!alive) return;
        setData(d.channel);
        setFollowing(d.channel.following);
        setFollowers(d.channel.followerCount);
      })
      .catch(e => { if (alive) setError((e as Error).message); });
    return () => { alive = false; };
  }, [username]);

  const toggleFollow = async () => {
    if (!data) return;
    if (!user) {
      toast({ title: "Login required", description: "Create a free account to follow creators." });
      navigate("/login");
      return;
    }
    try {
      const res = await post<{ following: boolean; followerCount: number }>(`/social/${data.id}/follow`, { channelId: data.id });
      setFollowing(res.following);
      setFollowers(res.followerCount);
      toast({ title: res.following ? `Following @${username}` : `Unfollowed @${username}` });
    } catch (e) {
      toast({ title: "Couldn't follow", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-40 text-center">
        <EmptyState icon="UserX" title="Creator not found" description={error}
          action={{ label: "Explore creators", onClick: () => navigate("/explore") }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6">
        <div className="shimmer h-48 rounded-3xl" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer aspect-[9/16] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const totalViews = data.videos.reduce((a, v) => a + v.views, 0);
  const socials = data.socialLinks ?? {};

  return (
    <div className="pb-24">
      {/* banner */}
      <div className="relative h-44 overflow-hidden md:h-60">
        <div className="absolute inset-0 bg-ink" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(40rem 20rem at 20% 0%, rgba(255,23,68,0.4), transparent 60%), radial-gradient(36rem 18rem at 85% 100%, rgba(22,119,255,0.45), transparent 60%)" }} />
        { }
        {data.videos[0] && (
          <img src={data.videos[0].thumbnailUrl ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="-mt-14 flex flex-col items-start gap-5 md:-mt-16 md:flex-row md:items-center">
          <Avatar src={data.avatarUrl} name={data.name} size={112} className="ring-4 ring-white shadow-xl" />
          <div className="flex-1 pb-1 md:pb-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{data.name}</h1>
              {data.verified && (
                <span className="flex items-center gap-1 rounded-full bg-brand-blue-soft px-2.5 py-1 text-xs font-bold text-brand-blue">
                  <Icons.BadgeCheck size={13} /> Verified creator
                </span>
              )}
              <StatusBadge status="APPROVED" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              @{data.username}
              {data.category && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                  <CategoryIcon name={data.category} size={11} /> {data.category}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 pb-1">
            <Button
              onClick={toggleFollow}
              className={following ? "rounded-full border-2 bg-white text-ink" : "grad-btn rounded-full text-white"}
              variant={following ? "outline" : "default"}
            >
              {following ? <Icons.UserCheck size={16} className="mr-1.5" /> : <Icons.UserPlus size={16} className="mr-1.5" />}
              {following ? "Following" : "Follow"}
            </Button>
          </div>
        </div>

        {/* stats bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { l: "Followers", v: compact(followers), icon: Icons.Users, c: "text-brand-blue" },
            { l: "Videos", v: String(data.videos.length), icon: Icons.Video, c: "text-brand-red" },
            { l: "Total views", v: compact(totalViews), icon: Icons.Eye, c: "text-brand-yellow" },
            { l: "Joined", v: fmtDate(data.joinedAt), icon: Icons.CalendarDays, c: "text-emerald-600" },
          ].map(s => (
            <div key={s.l} className="bento flex items-center gap-3 p-4">
              <s.icon size={20} className={s.c} />
              <div>
                <p className="font-display text-lg font-bold leading-none">{s.v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
              </div>
            </div>
          ))}
        </div>

        {/* bio + socials + earnings consent */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="bento p-6">
            <h2 className="font-display text-base font-bold">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {data.description || "This creator hasn't written a bio yet."}
            </p>
            {Object.values(socials).some(Boolean) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.instagram && <SocialChip icon={Icons.Instagram} label={`@${socials.instagram}`} />}
                {socials.youtube && <SocialChip icon={Icons.Youtube} label={socials.youtube} />}
                {socials.x && <SocialChip icon={Icons.Twitter} label={`@${socials.x}`} />}
                {socials.website && <SocialChip icon={Icons.Globe} label={socials.website} />}
              </div>
            )}
          </div>
          {data.showEarnings && data.verifiedEarnings !== null ? (
            <div className="bento bg-ink p-6 text-white">
              <p className="text-xs uppercase tracking-wider text-white/50">Verified lifetime earnings</p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-yellow">{usd(data.verifiedEarnings)}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Verified against Clipora's earnings ledger and displayed with this creator's explicit consent.
              </p>
            </div>
          ) : (
            <div className="bento p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Verified lifetime earnings</p>
              <p className="mt-1 font-display text-xl font-bold">Private</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                This creator has opted not to display earnings publicly. Creator earnings are only ever shown with explicit consent.
              </p>
            </div>
          )}
        </div>

        {/* videos */}
        <h2 className="mt-10 font-display text-xl font-bold">
          Videos <span className="ml-1 text-sm font-normal text-muted-foreground">({data.videos.length})</span>
        </h2>
        {data.videos.length === 0 ? (
          <div className="mt-4"><EmptyState icon="Video" title="No videos yet" description="This creator hasn't published any videos." /></div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {data.videos.map(v => (
              <button
                key={v.id} onClick={() => navigate(`/feed?v=${v.id}`)}
                className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <img src={v.thumbnailUrl ?? ""} alt={v.title} loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/15" />
                <span className="absolute right-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  {Math.round(v.duration)}s
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white">{v.title}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/70">
                    <span className="flex items-center gap-1"><Icons.Play size={11} fill="currentColor" /> {compact(v.views)}</span>
                    <span className="flex items-center gap-1"><Icons.Heart size={11} fill="currentColor" /> {compact(v.likes)}</span>
                  </div>
                  {v.publishedAt && <p className="mt-0.5 text-[10px] text-white/50">{timeAgo(v.publishedAt)}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialChip({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <Icon size={13} /> {label}
    </span>
  );
}
