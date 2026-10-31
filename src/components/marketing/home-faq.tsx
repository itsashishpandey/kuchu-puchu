"use client";

import * as Icons from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading, PrimaryCTA, SecondaryCTA } from "@/components/shared/ui-bits";
import { Link } from "@/components/app/router";

// ── Section 14: FAQ ────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How exactly do I earn money on Clipora?",
    a: "Two ways: (1) view revenue — $1.00 per 1,000 qualified views, calculated proportionally (no rounding down), for up to 4 months per video; and (2) upload rewards — $0.50 one-time for each approved original upload. Both credit to your pending balance, then clear to available after a 7-day holding period.",
  },
  {
    q: "What counts as a qualified view?",
    a: "A view from a real person who actually watches. We exclude bot traffic, automated refreshes, creator self-views, and views beyond a per-viewer daily cap on the same video. Every view event is recorded with a reason when it's excluded, so payouts stay auditable.",
  },
  {
    q: "Why does my account need approval before I can upload?",
    a: "Every creator account is reviewed by our team — usually within 2 business days. Approval keeps the platform free of impersonation, spam channels and stolen content, which protects earning rates for genuine creators.",
  },
  {
    q: "What video rules apply to uploads?",
    a: "Defaults: 40–60 seconds duration, MP4 or MOV, up to 200MB, max 2 uploads per day and 4 per week. Videos then pass an originality check (file checksum + visual and audio fingerprinting) and, in most cases, a quick manual review before going live.",
  },
  {
    q: "What happens if someone re-uploads my video?",
    a: "Our fingerprinting detects re-encoded or slightly modified copies — not just identical files. Duplicates are flagged for review, blocked from earning, and the original creator keeps full credit. You can also file a copyright report from any video.",
  },
  {
    q: "How do withdrawals work?",
    a: "Once your available balance is at least $25, request a payout to your bank account or PayPal. Requests move through Requested → Under Review → Approved → Processing → Paid, and every step is visible in your dashboard with payment references.",
  },
  {
    q: "When do my videos stop earning?",
    a: "Each video earns view revenue for 4 months from publication (configurable by the platform, shown on each video in your dashboard). After that the video stays public — it just stops generating new view earnings.",
  },
  {
    q: "Do rate changes affect money I've already earned?",
    a: "No. Every earning is recorded with the rate that was in effect at the time it was credited. If rates change, only future qualified views use the new rate — your finalized earnings are never recalculated.",
  },
  {
    q: "Do I keep ownership of my videos?",
    a: "Yes. You own your content. By uploading you grant Clipora the license needed to host, stream and monetize your videos on the platform — nothing more. You can request removal of your content at any time.",
  },
  {
    q: "Is there a cost or exclusivity requirement?",
    a: "No. Creating a channel is free, and Clipora is non-exclusive — you're free to publish anywhere else. We earn when creators earn: a sustainable platform is the whole point.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 md:py-24" aria-label="Frequently asked questions">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title={<>Questions, <span className="grad-text-blue">answered</span></>}
          subtitle="Everything creators ask before their first payout. Something missing? Our team replies within a business day."
        />
        <Accordion type="single" collapsible className="reveal space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i} value={`q${i}`}
              className="bento overflow-hidden border-none px-5 data-[state=open]:shadow-md"
            >
              <AccordionTrigger className="py-4 text-left font-display text-[15px] font-bold hover:no-underline hover:text-brand-red">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="reveal mt-6 text-center text-sm text-muted-foreground">
          Still curious? <Link to="/contact" className="font-semibold text-brand-red underline underline-offset-2">Talk to creator support →</Link>
        </p>
      </div>
    </section>
  );
}

// ── Section 15: Final CTA ─────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 md:py-28" aria-label="Get started">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-red/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-yellow/15 blur-3xl" />
      </div>
      <div className="reveal relative mx-auto max-w-4xl px-4 text-center md:px-6">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-yellow ring-1 ring-white/15">
          <Icons.Sparkles size={13} /> Free to join · Non-exclusive · You own your content
        </span>
        <h2 className="font-display text-4xl font-bold leading-[1.08] text-white md:text-6xl">
          Your Creativity<br /><span className="grad-text">Deserves to Get Paid.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/70">
          Join the creators turning 60 seconds of originality into a real income stream.
          Apply in 3 minutes — your first approved upload already earns.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <PrimaryCTA to="/register" className="!px-9 !py-6 !text-base">
            Become a Creator <Icons.ArrowRight size={18} className="ml-1" />
          </PrimaryCTA>
          <SecondaryCTA to="/feed" className="!border-white/20 !bg-white/5 !text-white !px-9 !py-6 !text-base hover:!border-white/40 hover:!text-white">
            <Icons.Play size={17} fill="currentColor" className="mr-1.5" /> Watch Videos First
          </SecondaryCTA>
        </div>
        <p className="mt-6 text-xs text-white/45">
          No credit card · No follower minimum · Withdraw anytime over $25
        </p>
      </div>
    </section>
  );
}
