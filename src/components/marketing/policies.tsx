"use client";

import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrimaryCTA } from "@/components/shared/ui-bits";
import { Link, navigate } from "@/components/app/router";

type PolicySection = { h: string; p: string[]; list?: string[] };
type Policy = { title: string; intro: string; updated: string; sections: PolicySection[] };

const POLICIES: Record<string, Policy> = {
  monetization: {
    title: "Creator Earnings & Monetization Policy",
    intro: "How views, uploads and payouts turn into money — the complete, plain-language rules.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Who can earn",
        p: ["Only approved creators with monetization in good standing can earn on Clipora. Accounts that are pending, rejected or suspended cannot upload or earn, and their content does not generate view revenue."],
        list: [
          "Creator account status must be APPROVED.",
          "Videos must be approved and original — duplicates never earn.",
          "Channels flagged for fraud may have monetization paused pending review.",
        ],
      },
      {
        h: "2. View revenue",
        p: [
          "Creators earn the current rate (default: $1.00) per 1,000 qualified views. Earnings are calculated proportionally per qualified view event — we never round down to complete thousands.",
          "A view is qualified when it comes from a real viewer with genuine watch time. We exclude bot traffic, automated refreshes, creator self-views and views beyond a per-viewer daily cap on the same video.",
        ],
      },
      {
        h: "3. Upload rewards",
        p: ["Each approved original upload earns a one-time reward (default: $0.50), credited exactly once per video after approval. Re-uploads, duplicates and re-encoding of existing content never receive rewards."],
      },
      {
        h: "4. Earning duration",
        p: ["View revenue accrues for a maximum of 4 months from a video's first publication date. After the window expires the video remains publicly available but stops generating new view earnings."],
      },
      {
        h: "5. Holding period & balances",
        p: [
          "Newly credited earnings are pending for 7 days (fraud-review holding period) before becoming available.",
          "Available balance = credited earnings past holding, minus funds locked in active withdrawal requests.",
        ],
      },
      {
        h: "6. Rate changes & history",
        p: ["Every earning stores the rate in effect when it was credited. Rate changes apply only to future qualified views and are announced to all creators in advance. Finalized earnings are never recalculated."],
      },
      {
        h: "7. Disallowed earnings",
        p: ["Earnings are reversed or withheld for duplicate or unoriginal content, artificially inflated views, engagement schemes, or videos removed for policy violations. Withheld rewards are never paid retroactively after removal."],
      },
    ],
  },
  community: {
    title: "Community Guidelines",
    intro: "The rules that keep Clipora safe, original and worth watching.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Be original",
        p: ["Only upload content you created or have clear rights to use. Re-uploading, re-encoding or slightly modifying someone else's video is not original — our fingerprinting will find it."],
      },
      {
        h: "2. Be authentic",
        p: ["No engagement schemes: view bots, engagement pods, misleading thumbnails or bait-and-switch titles. Genuine engagement is the only kind that pays."],
      },
      {
        h: "3. Be safe",
        p: ["No content that endangers people, promotes violence, self-harm, or exploitation. No sexual content involving minors — this results in immediate removal and legal reporting."],
        list: ["Dangerous acts and challenges", "Hate speech and harassment", "Impersonation of people or brands"],
      },
      {
        h: "4. Be respectful",
        p: ["Critique ideas, not people. Harassment, doxxing, targeted abuse and spam commenting lead to suspension."],
      },
      {
        h: "5. Enforcement",
        p: [
          "Violations follow a strike system: warning → content removal → upload suspension → account suspension.",
          "Serious violations skip steps. You can appeal any decision through dashboard appeals or support.",
        ],
      },
    ],
  },
  copyright: {
    title: "Copyright & Content Policy",
    intro: "You own your content. Here's exactly what that means — and how we protect it.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Ownership",
        p: ["Creators retain full ownership of uploaded content. By uploading, you grant Clipora a non-exclusive license to host, stream, display and monetize your videos on the platform. Nothing more."],
      },
      {
        h: "2. Duplicate detection",
        p: [
          "Every upload receives a unique permanent content ID and a three-layer fingerprint: SHA-256 file checksum, perceptual visual hash and audio fingerprint.",
          "Videos matching existing content above the similarity threshold are flagged for human review with a similarity score. Confirmed duplicates are rejected and never earn.",
        ],
      },
      {
        h: "3. Reporting infringement",
        p: ["If your work was re-uploaded without permission, use the Report → Copyright option on the video or email copyright@clipora.io. Verified reports result in removal of the infringing copy and forfeiture of any associated earnings."],
      },
      {
        h: "4. Counter-notices & appeals",
        p: ["Flagged creators can appeal from My Videos. A human reviewer examines evidence from both sides within 2 business days. Frivolous mass-reporting is itself a violation."],
      },
      {
        h: "5. Music & third-party material",
        p: ["Use audio you own, licensed or created. Uploads with copyrighted audio detected by fingerprinting are blocked from monetization until replaced or disputed."],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "What we collect, why, and the controls you have.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Data we collect",
        p: ["Account data (name, email, channel info), content you upload, and technical signals needed to run the platform (IP, device/browser signature, view events)."],
      },
      {
        h: "2. How we use it",
        p: ["Operating the feed and your channel, calculating qualified views and earnings, fraud prevention, and (if you opt in) platform announcements. We never sell personal data."],
        list: [
          "View events are stored with hashed viewer keys — not raw identities.",
          "Payment details are stored masked; full account numbers are never displayed again after entry.",
          "Fraud-detection logic and internal signals are never exposed publicly.",
        ],
      },
      {
        h: "3. Sharing",
        p: ["Only with payout providers (to pay you), authorities where legally required, and service infrastructure providers under data-processing agreements."],
      },
      {
        h: "4. Your controls",
        p: ["Access, export or delete your data from Account Settings. Public earnings display is opt-in per channel. Deleting your account removes personal data; anonymized aggregate statistics may be retained."],
      },
      {
        h: "5. Retention",
        p: ["Earnings and transaction records are retained for 7 years for accounting compliance. View event details are retained 12 months, then aggregated. Session data expires automatically."],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "The agreement between you and Clipora — in readable English.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Eligibility",
        p: ["You must be at least 16 years old (or the digital-consent age in your country) and able to form a binding contract. One creator account per person."],
      },
      {
        h: "2. Your account",
        p: ["Keep credentials secure; you're responsible for activity on your account. Channel names and usernames must not infringe trademarks or impersonate others."],
      },
      {
        h: "3. Content standards",
        p: ["Your content must comply with our Community Guidelines and Copyright Policy. You retain ownership and grant us the limited platform license described there."],
      },
      {
        h: "4. Monetization",
        p: ["Earnings follow the Monetization Policy. Rates may change with notice; stored earnings keep their original rates. We may withhold or reverse earnings tied to fraud or policy violations."],
      },
      {
        h: "5. Termination",
        p: ["You may delete your account anytime. We may suspend accounts for violations, with reason and an appeal path wherever legally required."],
      },
      {
        h: "6. Liability & disputes",
        p: ["The service is provided 'as is'. Our aggregate liability is limited to your lifetime platform earnings. Disputes are resolved per the governing law noted in your payout region."],
      },
    ],
  },
  payment: {
    title: "Payment & Withdrawal Policy",
    intro: "How money moves from your balance to your bank.",
    updated: "Last updated: November 1, 2026",
    sections: [
      {
        h: "1. Balances",
        p: [
          "Pending: credited earnings inside the 7-day holding period, plus funds locked in active withdrawal requests.",
          "Available: withdrawable funds. Lifetime: everything you've ever earned.",
        ],
      },
      {
        h: "2. Requesting a withdrawal",
        p: ["Minimum withdrawal is $25 (configurable by the platform). Requests are submitted to your saved payout method — bank transfer (ACH/SEPA) or PayPal, subject to regional availability. Your available balance is immediately reduced by the requested amount."],
      },
      {
        h: "3. Processing stages",
        p: ["Requested → Under Review → Approved → Processing → Paid. Each stage is visible in your dashboard with timestamps. Rejected requests return funds to your available balance with a stated reason."],
      },
      {
        h: "4. Timelines & references",
        p: ["Bank payouts arrive 3–5 business days after approval; PayPal 1–3. Every payment carries a reference (PAY-…) that support can trace end-to-end."],
      },
      {
        h: "5. Duplicate payout prevention",
        p: ["Each withdrawal can be paid exactly once. Our ledger enforces one payout per withdrawal record, and every payout is recorded as an immutable ledger transaction."],
      },
      {
        h: "6. Taxes",
        p: ["You're responsible for your taxes. Where required by law, we may collect tax information and issue statements before processing payouts."],
      },
    ],
  },
};

const SLUGS = [
  { slug: "monetization", label: "Earnings & monetization", icon: Icons.BadgeDollarSign },
  { slug: "payment", label: "Payment & withdrawals", icon: Icons.Banknote },
  { slug: "community", label: "Community guidelines", icon: Icons.Users },
  { slug: "copyright", label: "Copyright & content", icon: Icons.Copyright },
  { slug: "privacy", label: "Privacy policy", icon: Icons.ShieldCheck },
  { slug: "terms", label: "Terms & conditions", icon: Icons.FileText },
];

export function PolicyPage({ slug }: { slug: string }) {
  const policy = POLICIES[slug];
  if (!policy) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-40 text-center">
        <h1 className="font-display text-2xl font-bold">Policy not found</h1>
        <p className="mt-2 text-muted-foreground">The document you're looking for doesn't exist.</p>
        <Button className="mt-6 grad-btn text-white" onClick={() => navigate("/")}>Back home</Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6 md:pt-36">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Policy documents">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Policies</p>
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SLUGS.map(s => (
              <Link
                key={s.slug} to={`/policies/${s.slug}`}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  slug === s.slug ? "grad-btn text-white shadow" : "bg-white ring-1 ring-black/5 hover:bg-secondary"
                }`}
              >
                <s.icon size={16} /> {s.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{policy.title}</h1>
          <p className="mt-3 text-muted-foreground">{policy.intro}</p>
          <p className="mt-2 text-xs text-muted-foreground">{policy.updated}</p>

          <div className="mt-8 space-y-6">
            {policy.sections.map(s => (
              <section key={s.h} className="bento p-6 md:p-7">
                <h2 className="font-display text-lg font-bold text-ink">{s.h}</h2>
                {s.p.map((para, i) => (
                  <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">{para}</p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-2">
                    {s.list.map(li => (
                      <li key={li} className="flex gap-2.5 text-sm text-muted-foreground">
                        <Icons.CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-red" /> {li}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-ink p-8 text-center text-white">
            <h2 className="font-display text-xl font-bold">Ready to put these rates to work?</h2>
            <PrimaryCTA to="/register">Become a Creator</PrimaryCTA>
          </div>
        </article>
      </div>
    </div>
  );
}
