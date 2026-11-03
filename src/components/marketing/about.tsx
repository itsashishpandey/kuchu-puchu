"use client";

import * as Icons from "lucide-react";
import { SectionHeading, PrimaryCTA, SecondaryCTA, StatCounter } from "@/components/shared/ui-bits";
import { useReveal } from "@/components/app/router";

const VALUES = [
  { icon: Icons.Scale, title: "Fairness first", desc: "Same rules for every creator, whether you have 10 followers or 10 million. Transparent rates, auditable ledger." },
  { icon: Icons.ShieldCheck, title: "Originality is sacred", desc: "Fingerprinting protects creators from re-uploads. We'd rather grow slower than pay for stolen work." },
  { icon: Icons.HeartHandshake, title: "Creators are partners", desc: "We build with creators, not just for them. Policy changes are announced, never sprung." },
  { icon: Icons.Eye, title: "Radical transparency", desc: "Qualified-view logic, rate history and payout flows are documented and visible." },
];

export function AboutPage() {
  const setRef = useReveal<HTMLDivElement>();
  return (
    <div ref={setRef}>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-ink py-24 text-white md:py-32">
        <div className="dot-bg absolute inset-0 opacity-10" aria-hidden />
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-red/20 blur-3xl" aria-hidden />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl" aria-hidden />
        <div className="reveal relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-yellow ring-1 ring-white/15">
            About Kuchu Puchu
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            We exist so creators <span className="grad-text">get paid fairly</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-white/70 md:text-lg">
            Kuchu Puchu is a kids short-video platform with a simple promise: original cartoons, rhymes and
            stories earn real money, transparently, from the very first upload.
          </p>
        </div>
      </section>

      {/* 2. Mission */}
      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-2">
          <div className="reveal">
            <SectionHeading align="left" eyebrow="Our mission"
              title={<>Pay creators <span className="grad-text">first</span>, not last</>} />
            <p className="-mt-4 text-muted-foreground">
              Most platforms treat creator payouts as an afterthought — opaque formulas, moving thresholds,
              and constant policy surprises. We flipped it: monetization is the product.
              Every design decision starts with "does this make creator earnings clearer, fairer or faster?"
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Proportional payouts — no rounding views down to full thousands",
                "Immutable earnings ledger with rate snapshots for every credit",
                "Payout status tracked end-to-end with payment references",
              ].map(t => (
                <li key={t} className="flex gap-2.5 text-sm">
                  <Icons.CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-red" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-red/15 to-brand-blue/15 blur-2xl" aria-hidden />
            { }
            <img src="/images/hero-wide.webp" alt="Cute cartoon characters celebrating together"
              className="relative w-full rounded-3xl object-cover shadow-xl" />
          </div>
        </div>
      </section>

      {/* 3. Vision */}
      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="reveal bento relative overflow-hidden p-8 md:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-yellow/20 blur-3xl" aria-hidden />
            <SectionHeading align="left" eyebrow="Our vision"
              title={<>A creator economy where <span className="grad-text-blue">1,000 true fans</span> pays the bills</>} />
            <p className="-mt-4 max-w-3xl text-muted-foreground">
              By 2030 we want Kuchu Puchu to be the platform where a creator with a laptop, a tablet and a story idea
              can build sustainable income from 60-second kids originals — in any country, in any category, without
              needing a million followers first. Fair monetization shouldn't be a lottery; it should be a system.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { v: 120, s: "+", l: "Countries with payouts" },
                { v: 96, s: "%", l: "Payouts within 5 days" },
                { v: 0, s: "", l: "Follower minimums" },
              ].map(s => (
                <div key={s.l} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
                  <p className="font-display text-3xl font-bold text-brand-red">
                    <StatCounter value={s.v} />{s.s}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Creator-first philosophy */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="Creator-first philosophy"
            title={<>What "creator-first" <span className="grad-text">actually means</span></>}
            subtitle="Not a slogan — a checklist we hold every feature to." />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: Icons.Landmark, t: "Earnings before algorithms", d: "You can understand your payout without a computer science degree. Every cent traces to a view event or an approval — visible in your ledger." },
              { icon: Icons.FileCheck2, t: "Policies in plain language", d: "Our monetization rules fit on one page. Rate changes are announced in advance and never applied retroactively." },
              { icon: Icons.Laptop, t: "Non-exclusive by default", d: "Post anywhere else you like. We don't lock creators in — we earn loyalty by being the best payer, not the only option." },
              { icon: Icons.UserCheck, t: "Human review, human support", d: "Applications, appeals and payout issues are reviewed by people, with reasons — never silent rejections." },
            ].map(x => (
              <div key={x.t} className="reveal bento flex gap-4 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <span className="rounded-xl bg-brand-red-soft p-3"><x.icon size={22} className="text-brand-red" /></span>
                <div>
                  <h3 className="font-display text-base font-bold">{x.t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How monetization works */}
      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="Monetization model"
            title={<>How the money <span className="grad-text">flows</span></>}
            subtitle="Two earning streams, one auditable ledger." />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="reveal bento p-6">
              <span className="rounded-xl bg-brand-blue-soft p-3"><Icons.Eye size={22} className="text-brand-blue" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">Qualified views</h3>
              <p className="mt-2 text-sm text-muted-foreground">$1.00 per 1,000 qualified views, credited proportionally per event and valid for 4 months per video. Fraudulent, bot and self views never count.</p>
            </div>
            <div className="reveal bento p-6">
              <span className="rounded-xl bg-brand-red-soft p-3"><Icons.BadgeDollarSign size={22} className="text-brand-red" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">Upload rewards</h3>
              <p className="mt-2 text-sm text-muted-foreground">₹30 one-time per approved original upload (paid in USD at the current rate), once your channel has unlocked earning by reaching 2,500 views within 30 days — credited after our originality and quality review, exactly once per video.</p>
            </div>
            <div className="reveal bento p-6">
              <span className="rounded-xl bg-brand-yellow-soft p-3"><Icons.BookOpenCheck size={22} className="text-brand-yellow" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">Immutable ledger</h3>
              <p className="mt-2 text-sm text-muted-foreground">Every credit stores the rate in effect at that moment. Admin adjustments are audited. Rate changes never rewrite history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Originality policy */}
      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-2">
          <div className="reveal order-2 lg:order-1">
            { }
            <img src="/images/illus-shield.webp" alt="Content protection illustration"
              className="mx-auto w-full max-w-md rounded-3xl" />
          </div>
          <div className="reveal order-1 lg:order-2">
            <SectionHeading align="left" eyebrow="Originality policy"
              title={<>Original content only — <span className="grad-text">enforced by tech</span></>} />
            <p className="-mt-4 text-muted-foreground">
              Every upload is fingerprinted three ways: an exact SHA-256 checksum, a perceptual visual hash that
              survives re-encoding and cropping, and an audio fingerprint that catches lifted soundtracks.
              Near-matches go to a human review queue with a similarity score — and originals always keep their earnings.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: Icons.Fingerprint, t: "3-layer fingerprinting" },
                { icon: Icons.UserSearch, t: "Human review queue" },
                { icon: Icons.Flag, t: "Copyright reporting" },
                { icon: Icons.Gavel, t: "Appeals workflow" },
              ].map(x => (
                <div key={x.t} className="flex items-center gap-2.5 rounded-xl bg-secondary p-3.5">
                  <x.icon size={18} className="shrink-0 text-brand-red" />
                  <span className="text-sm font-semibold">{x.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Creator safety */}
      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="Creator safety"
            title={<>A platform you can <span className="grad-text-blue">trust with your work</span></>}
            subtitle="Safety isn't a filter — it's the foundation earnings are built on." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Icons.FileLock2, t: "Secure storage", d: "Signed upload URLs, server-side validation and malware scanning on every file." },
              { icon: Icons.EyeOff, t: "Privacy by default", d: "Payment details are masked at rest. Private data is never exposed publicly." },
              { icon: Icons.ShieldAlert, t: "Fraud protection", d: "Bot detection, view-burst flags and duplicate-earning prevention keep rates sustainable." },
              { icon: Icons.LifeBuoy, t: "Real support", d: "Payout, policy and account issues answered by humans within one business day." },
            ].map(x => (
              <div key={x.t} className="reveal bento p-5">
                <span className="rounded-xl bg-brand-blue-soft p-2.5"><x.icon size={20} className="text-brand-blue" /></span>
                <h3 className="mt-3 font-display text-sm font-bold">{x.t}</h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Values + CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading eyebrow="Our values" title={<>What we optimize <span className="grad-text">for</span></>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(v => (
              <div key={v.title} className="reveal bento p-6 transition-all hover:-translate-y-1 hover:shadow-md">
                <span className="grad-btn inline-flex rounded-xl p-3 text-white"><v.icon size={22} /></span>
                <h3 className="mt-4 font-display text-base font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-12 flex flex-col items-center gap-4 rounded-3xl bg-ink p-10 text-center text-white md:p-14">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Ready to build <span className="grad-text">your channel</span>?
            </h2>
            <p className="max-w-lg text-white/70">Apply in 3 minutes. Get approved in 2 days. Earn from your very first approved upload.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <PrimaryCTA to="/register">Become a Creator</PrimaryCTA>
              <SecondaryCTA to="/explore" className="!border-white/20 !bg-white/5 !text-white hover:!border-white/40 hover:!text-white">
                Explore Videos
              </SecondaryCTA>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
