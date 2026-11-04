"use client";

// mykuchupuchu.com/about — parents first (what Kuchu Puchu is, safety, topics), creators after.
// Keep every claim true: no invented statistics.
import * as Icons from "lucide-react";
import { usd } from "@/lib/format";
import { usePublicSettings, plural, unlockTarget } from "@/lib/use-public-settings";
import { SectionHeading, PrimaryCTA, SecondaryCTA } from "@/components/shared/ui-bits";
import { Link, useReveal } from "@/components/app/router";
import { AppButtons, AppCtaBand } from "@/components/shared/app-buttons";
import { CATEGORY_SEO } from "@/lib/seo-pages";
import { TRUST } from "./home-parents";

const VALUES = [
  { icon: Icons.Baby, title: "Kids come first", desc: "Every rule starts with one question: is this right for a child aged 3 to 8?" },
  { icon: Icons.ShieldCheck, title: "Original and safe", desc: "Creators are approved, videos are reviewed, and copies of other people's work are caught and blocked." },
  { icon: Icons.Scale, title: "Fair to creators", desc: "The same clear rules and rates for every creator, written in plain language." },
  { icon: Icons.Eye, title: "Open about how it works", desc: "How views count, how creators are paid and what we store are all written down in our policies." },
];

export function AboutPage() {
  const setRef = useReveal<HTMLDivElement>();
  const live = usePublicSettings();
  return (
    <div ref={setRef}>
      {/* 1. Hero + app CTA 1 */}
      <section className="relative overflow-hidden bg-ink pb-20 pt-28 text-white md:pb-28 md:pt-36">
        <div className="dot-bg absolute inset-0 opacity-10" aria-hidden />
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-red/20 blur-3xl" aria-hidden />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-yellow ring-1 ring-white/15">
            About Kuchu Puchu
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            About Kuchu Puchu: <span className="grad-text">Safe Educational Videos for Kids</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-white/70 md:text-lg">
            Kuchu Puchu is a free, ad-free video app and website made only for children aged 3 to 8. Short,
            funny cartoons, nursery rhymes, poems and stories help kids learn ABCs, counting, colors, shapes,
            names and good habits, and the creators who make them are paid fairly.
          </p>
          <AppButtons tone="dark" align="center" className="mt-8" />
        </div>
      </section>

      {/* 2. What is Kuchu Puchu */}
      <section className="py-16 md:py-24" aria-labelledby="what-is">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="reveal">
            <h2 id="what-is" className="font-display text-3xl font-bold leading-tight text-ink md:text-[2.6rem]">
              What is <span className="grad-text">Kuchu Puchu</span>?
            </h2>
            <div className="mt-5 space-y-4 text-muted-foreground md:text-lg">
              <p>
                Kuchu Puchu is a kids video app for preschool, kindergarten and the first school years. Kids
                swipe through short videos made for their age: cartoons, rhymes and songs, stories, early
                learning, animals, crafts, good habits and more.
              </p>
              <p>
                Every video comes from an independent creator who applied and was approved by our team, and
                videos are reviewed before they go live. There are no ads, no comments and no sign-up for kids.
              </p>
              <p>
                Videos are in Hindi, English, Punjabi, Haryanvi, Urdu and more. In the app, a grown-up can choose
                which languages to show, behind a grown-ups check.
              </p>
            </div>
          </div>
          <img src="/images/hero-kids.webp" alt="Two smiling cartoon kids, a girl and a boy, ready to watch Kuchu Puchu"
            className="reveal mx-auto w-full max-w-sm rounded-3xl object-cover shadow-xl" />
        </div>
      </section>

      {/* 3. Topics (links to every category page) */}
      <section className="bg-surface py-16 md:py-20" aria-labelledby="about-topics">
        <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
          <h2 id="about-topics" className="reveal font-display text-3xl font-bold text-ink md:text-[2.4rem]">
            Kuchu Puchu Videos for Every Little Interest
          </h2>
          <p className="reveal mx-auto mt-3 max-w-2xl text-muted-foreground">Tap a topic to see its videos, what kids learn and tips for parents.</p>
          <ul className="reveal mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORY_SEO.map(c => (
              <li key={c.dbSlug}>
                <Link to={c.path} className="bento flex h-full items-center gap-2 p-4 text-left text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:text-brand-blue">
                  <span className="text-2xl" aria-hidden>{c.emoji}</span> {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Promise to parents */}
      <section className="py-16 md:py-24" aria-labelledby="about-trust">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 id="about-trust" className="reveal mx-auto mb-10 max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink md:text-[2.4rem]">
            Our Promise to <span className="grad-text-blue">Parents</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map(t => (
              <li key={t.title} className="reveal bento flex gap-3 p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-soft">
                  <t.icon size={18} className="text-brand-blue" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{t.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="reveal mt-6 text-center text-sm text-muted-foreground">
            Details in our <a href="/privacy" className="font-semibold text-brand-blue underline underline-offset-2">privacy policy</a> and{" "}
            <a href="/community-guidelines" className="font-semibold text-brand-blue underline underline-offset-2">community guidelines</a>.
          </p>
        </div>
      </section>

      {/* 5. App CTA 2 */}
      <AppCtaBand heading="Kuchu Puchu in Your Pocket" text="The free Kuchu Puchu app opens straight into short learning videos for kids, with no ads and no account." />

      {/* 6. Creators */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="For creators"
            title={<>Made by creators who <span className="grad-text">get paid fairly</span></>}
            subtitle="Kuchu Puchu pays the people who make kids videos, with rules that fit on one page." />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="reveal bento p-6">
              <span className="rounded-xl bg-brand-blue-soft p-3"><Icons.Eye size={22} className="text-brand-blue" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">Qualified views</h3>
              <p className="mt-2 text-sm text-muted-foreground">{usd(live.ratePer1000Views)} per 1,000 qualified views, credited proportionally and valid for {plural(live.monetizationDurationMonths, "month")} per video. Bot, fake and self views never count.</p>
            </div>
            <div className="reveal bento p-6">
              <span className="rounded-xl bg-brand-red-soft p-3"><Icons.BadgeDollarSign size={22} className="text-brand-red" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">Upload rewards</h3>
              <p className="mt-2 text-sm text-muted-foreground">{usd(live.rewardPerUpload)} one-time per approved original upload, once a channel has unlocked earning by reaching {unlockTarget(live)}.</p>
            </div>
            <div className="reveal bento p-6">
              <span className="rounded-xl bg-brand-yellow-soft p-3"><Icons.Fingerprint size={22} className="text-brand-yellow" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">Originals protected</h3>
              <p className="mt-2 text-sm text-muted-foreground">Every upload is checked against the others by file, picture and sound, so copies are flagged for review and originals keep their credit.</p>
            </div>
          </div>
          <p className="reveal mt-6 text-center text-sm text-muted-foreground">
            Full rules: <Link to="/monetization" className="font-semibold text-brand-blue underline underline-offset-2">monetization policy</Link> ·{" "}
            <Link to="/payment-policy" className="font-semibold text-brand-blue underline underline-offset-2">payment policy</Link> ·{" "}
            <Link to="/copyright-policy" className="font-semibold text-brand-blue underline underline-offset-2">copyright policy</Link>
          </p>
        </div>
      </section>

      {/* 7. Values + creator CTA */}
      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="Our values" title={<>What we care <span className="grad-text">about</span></>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(v => (
              <div key={v.title} className="reveal bento p-6">
                <span className="grad-btn inline-flex rounded-xl p-3 text-white"><v.icon size={22} /></span>
                <h3 className="mt-4 font-display text-base font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-12 flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center ring-1 ring-black/5 md:p-14">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Make videos for kids? <span className="grad-text">Join our creators</span>
            </h2>
            <p className="max-w-lg text-muted-foreground">Apply in a few minutes. Our team reviews every application.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <PrimaryCTA to="/register">Become a Creator</PrimaryCTA>
              <SecondaryCTA to="/explore">Explore Videos</SecondaryCTA>
            </div>
          </div>
        </div>
      </section>

      {/* 8. App CTA 3 */}
      <AppCtaBand tone="dark" heading="Download the Kuchu Puchu App"
        text="Funny learning videos for kids aged 3–8: ABCs, counting, colors, rhymes and stories. Free, with no ads." />
    </div>
  );
}
