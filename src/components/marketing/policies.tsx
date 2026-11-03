"use client";

import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrimaryCTA } from "@/components/shared/ui-bits";
import { Link, navigate } from "@/components/app/router";

import { POLICIES, livePolicy } from "@/lib/policies-data";
import { usePublicSettings } from "@/lib/use-public-settings";

const SLUGS = [
  { slug: "monetization", label: "Earnings & monetization", icon: Icons.BadgeDollarSign },
  { slug: "payment", label: "Payment & withdrawals", icon: Icons.Banknote },
  { slug: "community", label: "Community guidelines", icon: Icons.Users },
  { slug: "copyright", label: "Copyright & content", icon: Icons.Copyright },
  { slug: "privacy", label: "Privacy policy", icon: Icons.ShieldCheck },
  { slug: "terms", label: "Terms & conditions", icon: Icons.FileText },
];

export function PolicyPage({ slug }: { slug: string }) {
  const live = usePublicSettings();
  const policy = POLICIES[slug] ? livePolicy(POLICIES[slug], live) : undefined;
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
