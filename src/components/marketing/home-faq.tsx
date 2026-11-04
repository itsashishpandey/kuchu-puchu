"use client";

import * as Icons from "lucide-react";
import { SectionHeading, SecondaryCTA } from "@/components/shared/ui-bits";
import { Link } from "@/components/app/router";
import { usd } from "@/lib/format";
import { usePublicSettings, money, plural, lengthRange, formatList, fillNumbers, type PublicSettings } from "@/lib/use-public-settings";
import { FaqList } from "./home-parents";
import { AppButtons } from "@/components/shared/app-buttons";

// ── Creator FAQ ────────────────────────────────────────────────────────────

const faqs = (s: PublicSettings) => [
  {
    q: "How exactly do I earn money on Kuchu Puchu?",
    a: `Two ways: (1) view revenue — ${usd(s.ratePer1000Views)} per 1,000 qualified views, calculated proportionally (no rounding down), for up to ${plural(s.monetizationDurationMonths, "month")} per video; and (2) upload rewards — ${usd(s.rewardPerUpload)} one-time for each approved original upload. Earning unlocks once — the first time your channel gets ${s.minMonthlyChannelViews.toLocaleString("en-US")} genuine views within 30 days. Both credit to your pending balance, then clear to available after a ${s.holdingPeriodDays}-day holding period.`,
  },
  {
    q: "What counts as a qualified view?",
    a: fillNumbers("A view {whereViewsCount} from a real person who actually watches. The same viewer counts once per video {repeatWindow} (repeat plays in between don't count), and one internet connection adds at most {networkCap} views per video in that time. We also exclude {websitePlays}bot traffic and creator self-views. Every view event is recorded with a reason when it's excluded, so payouts stay auditable.", s),
  },
  {
    q: "Why does my account need approval before I can upload?",
    a: "Every creator account is reviewed by our team — usually within 2 business days. Approval keeps the platform free of impersonation, spam channels and stolen content, which protects earning rates for genuine creators.",
  },
  {
    q: "What video rules apply to uploads?",
    a: `Currently: ${lengthRange(s)} long (set by the platform), ${formatList(s)}, up to ${s.maxFileSizeMB}MB, max ${s.maxDailyUploads} uploads per day and ${s.maxWeeklyUploads} per week. Videos then pass an originality check (file checksum + visual and audio fingerprinting) and, in most cases, a quick manual review before going live.`,
  },
  {
    q: "What happens if someone re-uploads my video?",
    a: "Our fingerprinting detects re-encoded or slightly modified copies — not just identical files. Duplicates are flagged for review, blocked from earning, and the original creator keeps full credit. You can also file a copyright report from any video.",
  },
  {
    q: "How do withdrawals work?",
    a: `Once your available balance is at least ${money(s.minWithdrawalAmount)}, request a payout to your bank account or PayPal. Requests move through Requested → Under Review → Approved → Processing → Paid, and every step is visible in your dashboard with payment references.`,
  },
  {
    q: "When do my videos stop earning?",
    a: `Each video earns view revenue for ${plural(s.monetizationDurationMonths, "month")} from publication (configurable by the platform, shown on each video in your dashboard). After that the video stays public — it just stops generating new view earnings.`,
  },
  {
    q: "Do rate changes affect money I've already earned?",
    a: "No. Every earning is recorded with the rate that was in effect at the time it was credited. If rates change, only future qualified views use the new rate — your finalized earnings are never recalculated.",
  },
  {
    q: "Do I keep ownership of my videos?",
    a: "Yes. You own your content. By uploading you grant Kuchu Puchu the license needed to host, stream and monetize your videos on the platform — nothing more. You can request removal of your content at any time.",
  },
  {
    q: "Is there a cost or exclusivity requirement?",
    a: "No. Creating a channel is free, and Kuchu Puchu is non-exclusive — you're free to publish anywhere else. We earn when creators earn: a sustainable platform is the whole point.",
  },
];

export function FAQ() {
  const live = usePublicSettings();
  return (
    <section className="py-16 md:py-24" aria-label="Frequently asked questions">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Creator FAQ"
          title={<>Creator questions, <span className="grad-text-blue">answered</span></>}
          subtitle="Everything creators ask before their first payout. Something missing? Our team replies within a business day."
        />
        <FaqList items={faqs(live)} />
        <p className="reveal mt-6 text-center text-sm text-muted-foreground">
          Still curious? <Link to="/contact" className="font-semibold text-brand-red underline underline-offset-2">Talk to creator support →</Link>
        </p>
      </div>
    </section>
  );
}

// ── Final CTA: parents first, creators second ─────────────────────────────

export function FinalCTA() {
  const live = usePublicSettings();
  return (
    <section className="relative overflow-hidden bg-ink py-20 md:py-28" aria-label="Get started">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-red/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-yellow/15 blur-3xl" />
      </div>
      <div className="reveal relative mx-auto max-w-4xl px-4 text-center md:px-6">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-yellow ring-1 ring-white/15">
          <Icons.Sparkles size={13} /> Free · No ads · Ages 3–8
        </span>
        <h2 className="font-display text-4xl font-bold leading-[1.08] text-white md:text-6xl">
          Learning Time Is<br /><span className="grad-text">Fun Time.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/70">
          Download the free Kuchu Puchu app or watch on the website: funny learning videos for kids,
          with no ads and no sign-up.
        </p>
        <AppButtons tone="dark" align="center" className="mt-9" />
        <div className="mt-5 flex justify-center">
          <SecondaryCTA to="/feed" className="!border-white/20 !bg-white/5 !text-white !px-9 !py-6 !text-base hover:!border-white/40 hover:!text-white">
            <Icons.Play size={17} fill="currentColor" className="mr-1.5" /> Watch Free Videos
          </SecondaryCTA>
        </div>
        <p className="mt-8 text-sm text-white/60">
          Make videos for kids?{" "}
          <Link to="/register" className="font-semibold text-brand-yellow underline underline-offset-2">Become a creator</Link>
          {" "}· free to join, withdraw from {money(live.minWithdrawalAmount)}
        </p>
      </div>
    </section>
  );
}
