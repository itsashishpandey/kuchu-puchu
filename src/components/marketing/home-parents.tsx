"use client";

// Homepage sections for parents: what kids learn, why it's safe, the app, and the parents' FAQ.
// All text is in the server-rendered page (no data fetching), so search engines and AI
// assistants read it without running scripts.
import * as Icons from "lucide-react";
import { SecondaryCTA } from "@/components/shared/ui-bits";
import { AppButtons } from "@/components/shared/app-buttons";
import { Link } from "@/components/app/router";
import { LEARN_TOPICS, PARENT_FAQS } from "@/lib/home-seo";
import { categoryPath } from "@/lib/seo-pages";

/**
 * Questions and answers as native <details>: the answers stay in the page's HTML even while closed
 * (an accordion that unmounts closed answers hides them from crawlers).
 */
export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="reveal space-y-3">
      {items.map(f => (
        <details key={f.q} className="group bento overflow-hidden px-5 open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left hover:text-brand-red [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-[15px] font-bold">{f.q}</h3>
            <Icons.ChevronDown size={16} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

// ── What kids learn ─────────────────────────────────────────────────────────

export function LearnTopics() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="learn-topics">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="reveal mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-pink-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-pink">
            <Icons.GraduationCap size={13} /> Learning through play
          </span>
          <h2 id="learn-topics" className="font-display text-3xl font-bold leading-[1.1] text-ink md:text-[2.6rem]">
            What Kids Learn with <span className="grad-text">Kuchu Puchu</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Kuchu Puchu educational videos turn early learning into play. In short, funny cartoons and
            songs, kids aged 3–8 learn ABCs, counting, colors, shapes, names, poems and more.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {LEARN_TOPICS.map(t => (
            <Link key={t.title} to={categoryPath(t.slug)}
              className="reveal bento group flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="text-4xl" aria-hidden>{t.emoji}</span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">{t.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-blue">
                Watch videos <Icons.ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why parents trust it ────────────────────────────────────────────────────

export const TRUST = [
  { icon: Icons.Baby, title: "Made only for ages 3–8", text: "Every video is made for young children: no violence, scary or adult content, and no bad language." },
  { icon: Icons.Ban, title: "No ads, no tracking", text: "There are no ads in the app or on the website, and no advertising IDs or tracking tools." },
  { icon: Icons.ShieldCheck, title: "Checked by people", text: "Every creator is approved by our team, and videos are reviewed before they go live." },
  { icon: Icons.MessageSquareOff, title: "No comments or chat", text: "Comments are turned off, so strangers can't contact your child." },
  { icon: Icons.UserX, title: "No sign-up for kids", text: "Kids watch without an account. The app opens straight into videos." },
  { icon: Icons.Lock, title: "A grown-ups area", text: "Languages, reporting and outside links sit behind a grown-ups check." },
];

export function ParentTrust() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="parent-trust">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <img src="/images/illus-shield.webp" alt="A teddy bear beside a smiling shield and a play button: safe videos for kids"
          loading="lazy" className="reveal mx-auto w-full max-w-xs rounded-3xl bg-white p-4 shadow-md lg:max-w-sm" />
        <div>
          <span className="reveal mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            <Icons.ShieldCheck size={13} /> For parents
          </span>
          <h2 id="parent-trust" className="reveal font-display text-3xl font-bold leading-[1.1] text-ink md:text-[2.6rem]">
            A Safe Kids Video App <span className="grad-text-blue">Parents Can Trust</span>
          </h2>
          <p className="reveal mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Kuchu Puchu is built for little kids and the grown-ups who look after them, so your child
            can enjoy learning videos without ads, strangers or surprises.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
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
          <p className="reveal mt-5 text-sm text-muted-foreground">
            Read our <a href="/privacy" className="font-semibold text-brand-blue underline underline-offset-2">privacy policy</a> and{" "}
            <a href="/community-guidelines" className="font-semibold text-brand-blue underline underline-offset-2">community guidelines</a>.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── The app ────────────────────────────────────────────────────────────────

const APP_STEPS = [
  { title: "Get the app", text: "Kuchu Puchu is coming to Android and iPhone. It's free, with nothing to buy." },
  { title: "Open & watch", text: "The app opens straight into videos. Kids need no account." },
  { title: "Set it up together", text: "A grown-up can pick languages and report videos behind a grown-ups check." },
];

export function AppDownload() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="app-download">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="reveal mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-blue-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue">
            <Icons.Smartphone size={13} /> Free app
          </span>
          <h2 id="app-download" className="reveal font-display text-3xl font-bold leading-[1.1] text-ink md:text-[2.6rem]">
            Download the <span className="grad-text">Kuchu Puchu App</span>
          </h2>
          <p className="reveal mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Get Kuchu Puchu funny learning videos for kids on your phone or tablet. The app is free,
            has no ads and is made for small hands: big buttons, swipe-to-watch short videos, and
            settings behind a grown-ups check. Until it's in your app store, kids can watch free on the website.
          </p>
          <ol className="mt-7 grid gap-3 sm:grid-cols-3">
            {APP_STEPS.map((s, i) => (
              <li key={s.title} className="reveal bento p-4">
                <span className="grad-btn inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white">{i + 1}</span>
                <h3 className="mt-2 font-display text-base font-bold text-ink">{s.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
          <AppButtons className="reveal mt-8" />
          <div className="reveal mt-4">
            <SecondaryCTA to="/feed">
              <Icons.Play size={16} className="mr-1" fill="currentColor" /> Watch on the website
            </SecondaryCTA>
          </div>
        </div>
        <img src="/images/illus-phone.webp" alt="The Kuchu Puchu app on a phone, showing cartoon animal videos for kids"
          loading="lazy" className="reveal mx-auto w-full max-w-xs rounded-3xl shadow-md lg:max-w-sm" />
      </div>
    </section>
  );
}

// ── Parents' FAQ ───────────────────────────────────────────────────────────

export function ParentFAQ() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="parent-faq">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="reveal mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-pink-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-pink">
            <Icons.HelpCircle size={13} /> Parents&rsquo; FAQ
          </span>
          <h2 id="parent-faq" className="font-display text-3xl font-bold leading-[1.1] text-ink md:text-[2.6rem]">
            Questions Parents Ask About <span className="grad-text-blue">Kuchu Puchu</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Quick answers about safety, age, languages and the Kuchu Puchu app.
          </p>
        </div>
        <FaqList items={PARENT_FAQS} />
      </div>
    </section>
  );
}

/** A divider that opens the creators' part of the homepage. */
export function CreatorsDivider() {
  return (
    <div className="bg-white px-4 pt-16 text-center md:pt-24">
      <p className="reveal font-display text-sm font-bold uppercase tracking-[0.2em] text-brand-pink">For creators</p>
      <p className="reveal mx-auto mt-2 max-w-2xl text-base text-muted-foreground md:text-lg">
        Make cartoons, rhymes or stories for kids? Upload them to Kuchu Puchu and earn from every qualified view.
      </p>
    </div>
  );
}
