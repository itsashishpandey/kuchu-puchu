"use client";

import { Fragment } from "react";
import * as Icons from "lucide-react";
import { AppButtons, AppCtaBand } from "@/components/shared/app-buttons";
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
    <>
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6 md:pt-36">
      {/* grid-cols-1 (minmax(0,1fr)): the side-scrolling policy menu otherwise widens the page on phones */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
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

          {/* app CTA 1 */}
          <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-brand-blue-soft to-brand-pink-soft p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-base font-bold text-ink">The Kuchu Puchu app: free learning videos for kids, no ads.</p>
            <AppButtons className="shrink-0" />
          </div>

          <div className="mt-8 space-y-6">
            {policy.sections.map((s, i) => (
              <Fragment key={s.h}>
              {/* app CTA 2, halfway down */}
              {i === Math.floor(policy.sections.length / 2) && (
                <aside className="rounded-3xl bg-ink p-6 text-center text-white" aria-label="Get the Kuchu Puchu app">
                  <p className="font-display text-lg font-bold">Watch Kuchu Puchu videos in the app</p>
                  <p className="mt-1 text-sm text-white/70">Cartoons, rhymes, stories and learning videos for kids aged 3–8.</p>
                  <AppButtons tone="dark" align="center" className="mt-4" />
                </aside>
              )}
              <section className="bento p-6 md:p-7">
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
              </Fragment>
            ))}
          </div>

          {CREATOR_POLICIES.has(slug) && (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-surface p-8 text-center ring-1 ring-black/5">
              <h2 className="font-display text-xl font-bold">Make videos for kids? Put these rules to work.</h2>
              <PrimaryCTA to="/register">Become a Creator</PrimaryCTA>
            </div>
          )}
        </article>
      </div>
    </div>
    {/* app CTA 3 */}
    <AppCtaBand tone="dark" heading="Download the Kuchu Puchu App"
      text="Free, ad-free learning videos for kids aged 3–8: cartoons, nursery rhymes, stories, ABCs and more." />
    </>
  );
}

const CREATOR_POLICIES = new Set(["monetization", "payment", "copyright"]);
