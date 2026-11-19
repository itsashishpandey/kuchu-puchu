"use client";

// mykuchupuchu.com/blog and /blog/<slug>. Text comes from src/lib/blog-posts.ts and is all in the
// server HTML (search engines and AI assistants read it without running scripts).
import * as Icons from "lucide-react";
import { Link, useReveal } from "@/components/app/router";
import { AppButtons, AppCtaBand } from "@/components/shared/app-buttons";
import { FaqList } from "./home-parents";
import { BLOG_POSTS, blogPostBySlug, type BlogApp } from "@/lib/blog-posts";

const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// ── /blog ────────────────────────────────────────────────────────────────

export function BlogIndexPage() {
  const setRef = useReveal<HTMLDivElement>();
  return (
    <div ref={setRef}>
      <section className="mesh-bg pb-12 pt-28 md:pb-16 md:pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-pink ring-1 ring-brand-pink/20">
            <Icons.BookOpen size={13} /> Kuchu Puchu Blog
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-ink md:text-6xl">
            Kuchu Puchu Blog: <span className="grad-text">Kids Videos &amp; Parenting Tips</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-ink/70 md:text-lg">
            Guides for parents of kids aged 3–8: safe video apps, learning through play and healthy screen time.
          </p>
          <AppButtons align="center" className="mt-7" />
        </div>
      </section>

      <section className="py-14 md:py-20" aria-label="Blog posts">
        <ul className="mx-auto grid max-w-5xl gap-5 px-4 md:grid-cols-2 md:px-6">
          {BLOG_POSTS.map(p => (
            <li key={p.slug} className="reveal">
              <Link to={`/blog/${p.slug}`} className="bento group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                <img src={p.image} alt={p.imageAlt} loading="lazy" className="aspect-[16/9] w-full bg-surface object-contain p-4" />
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold text-muted-foreground">{fmt(p.published)} · {p.readMinutes} min read</p>
                  <h2 className="mt-2 font-display text-xl font-bold text-ink group-hover:text-brand-blue">{p.h1}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-blue">Read the guide <Icons.ArrowRight size={14} /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AppCtaBand heading="Get the Kuchu Puchu App" text="Short, funny learning videos for kids aged 3–8. Free, with no ads and no sign-up for kids." />
      <AppCtaBand tone="dark" heading="Learning Time Is Fun Time" text="Cartoons, nursery rhymes, stories and ABC videos your kids will love, on Android and iPhone." />
    </div>
  );
}

// ── /blog/<slug> ─────────────────────────────────────────────────────────

function AppSection({ app }: { app: BlogApp }) {
  const ours = app.links.some(l => l.own);
  return (
    <section id={app.id} className="reveal scroll-mt-24 border-t pt-10" aria-labelledby={`${app.id}-title`}>
      <h2 id={`${app.id}-title`} className="font-display text-2xl font-bold text-ink md:text-3xl">
        {app.rank}. {app.name}: {app.bestFor}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[["Ages", app.ages], ["Cost", app.cost], ["Kids post videos", app.postsVideos], ["Platforms", app.platforms]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface px-3 py-2">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {app.summary.map(p => <p key={p.slice(0, 30)} className="mt-4 text-base leading-relaxed text-ink/80">{p}</p>)}
      <h3 className="mt-5 font-display text-lg font-bold text-ink">Why parents like it</h3>
      <ul className="mt-2 space-y-1.5">
        {app.highlights.map(h => (
          <li key={h} className="flex gap-2 text-ink/80"><Icons.CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {h}</li>
        ))}
      </ul>
      <h3 className="mt-5 font-display text-lg font-bold text-ink">Good to know</h3>
      <ul className="mt-2 space-y-1.5">
        {app.goodToKnow.map(h => (
          <li key={h} className="flex gap-2 text-ink/80"><Icons.Info size={18} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden /> {h}</li>
        ))}
      </ul>
      {ours ? (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-blue-soft to-brand-pink-soft p-5">
          <p className="font-display text-lg font-bold text-ink">Download Kuchu Puchu free</p>
          <AppButtons className="mt-3" />
          <p className="mt-3 text-sm text-muted-foreground">
            Or <Link to="/" className="font-semibold text-brand-blue underline underline-offset-2">watch free on mykuchupuchu.com</Link>.
          </p>
        </div>
      ) : (
        <p className="mt-5 text-sm">
          {app.links.map(l => (
            <a key={l.url} href={l.url} target="_blank" rel="nofollow noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline">
              Visit {l.label} <Icons.ExternalLink size={13} aria-hidden />
            </a>
          ))}
        </p>
      )}
    </section>
  );
}

export function BlogPostPage({ slug }: { slug: string }) {
  const setRef = useReveal<HTMLDivElement>();
  const post = blogPostBySlug(slug)!;
  const [first, ...rest] = post.apps;
  return (
    <div ref={setRef}>
      <article>
        {/* header + app CTA 1 */}
        <header className="mesh-bg pb-10 pt-24 md:pt-32">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink/60">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link to="/" className="font-semibold hover:text-brand-blue">Home</Link></li>
                <li aria-hidden><Icons.ChevronRight size={14} /></li>
                <li><Link to="/blog" className="font-semibold hover:text-brand-blue">Blog</Link></li>
                <li aria-hidden><Icons.ChevronRight size={14} /></li>
                <li aria-current="page" className="line-clamp-1 font-semibold text-ink">{post.crumb}</li>
              </ol>
            </nav>
            <h1 className="font-display text-[2.2rem] font-extrabold leading-[1.1] text-ink md:text-5xl">{post.h1}</h1>
            <p className="mt-4 text-sm text-ink/60">
              By the Kuchu Puchu team · <time dateTime={post.updated}>Updated {fmt(post.updated)}</time> · {post.readMinutes} min read
            </p>
            <div className="mt-6 rounded-2xl border-l-4 border-brand-blue bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">Quick answer</p>
              <p className="mt-2 text-base leading-relaxed text-ink">{post.quickAnswer}</p>
            </div>
            <AppButtons className="mt-6" />
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 pb-6 pt-10 md:px-6">
          {post.intro.map(p => <p key={p.slice(0, 30)} className="mb-4 text-lg leading-relaxed text-ink/80">{p}</p>)}
          <p className="mb-8 rounded-xl bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
            <strong className="text-ink">Note:</strong> {post.disclosure}
          </p>

          {/* the list at a glance */}
          <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">The {post.apps.length} Best {post.topic} at a Glance</h2>
          <ol className="mt-4 space-y-1.5">
            {post.apps.map(a => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="font-semibold text-brand-blue hover:underline">{a.rank}. {a.name}</a>
                <span className="text-ink/70">: {a.bestFor}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-black/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Comparison of {post.topic.toLowerCase()}</caption>
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                <tr>{["App", "Ages", "Cost", "Kids post videos", "Chat"].map(h => <th key={h} scope="col" className="px-3 py-2.5 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {post.apps.map(a => (
                  <tr key={a.id} className={`border-t ${a.rank === 1 ? "bg-brand-yellow-soft/60" : ""}`}>
                    <th scope="row" className="px-3 py-2.5 font-bold text-ink">{a.rank}. {a.name}</th>
                    <td className="px-3 py-2.5">{a.ages}</td>
                    <td className="px-3 py-2.5">{a.cost}</td>
                    <td className="px-3 py-2.5">{a.postsVideos}</td>
                    <td className="px-3 py-2.5">{a.chat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 font-display text-2xl font-bold text-ink md:text-3xl">How We Chose These Apps</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {post.howWeChose.map(c => (
              <li key={c.title} className="bento p-4">
                <h3 className="font-display text-base font-bold text-ink">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Facts checked on {post.factsChecked} from each app&rsquo;s store listing and website. Prices and features can change.</p>

          <div className="mt-10"><AppSection app={first} /></div>
        </div>

        {/* app CTA 2 */}
        <AppCtaBand heading="Try Kuchu Puchu Free" text="The TikTok-style video app made for kids aged 3–8: short learning videos, no ads, no comments and no sign-up." />

        <div className="mx-auto max-w-3xl space-y-10 px-4 pb-6 pt-10 md:px-6">
          {rest.map(a => <AppSection key={a.id} app={a} />)}

          <section className="reveal border-t pt-10" aria-labelledby="tips">
            <h2 id="tips" className="font-display text-2xl font-bold text-ink md:text-3xl">Tips for Using Video Apps with Young Kids</h2>
            <ul className="mt-4 space-y-3">
              {post.tips.map(t => (
                <li key={t.title} className="bento p-4">
                  <h3 className="font-display text-base font-bold text-ink">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="reveal border-t pt-10" aria-labelledby="faq">
            <h2 id="faq" className="mb-6 font-display text-2xl font-bold text-ink md:text-3xl">{post.topic}: FAQ</h2>
            <FaqList items={post.faqs} />
          </section>

          <section className="reveal border-t pt-10" aria-labelledby="more">
            <h2 id="more" className="font-display text-xl font-bold text-ink">Watch Kuchu Puchu Videos for Kids</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {post.related.map(r => (
                <li key={r.path}>
                  <Link to={r.path} className="inline-flex rounded-full bg-surface px-4 py-2 text-sm font-semibold ring-1 ring-black/5 hover:text-brand-blue">{r.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>

      {/* app CTA 3 */}
      <AppCtaBand tone="dark" heading="Download the Kuchu Puchu App"
        text="The safe, ad-free alternative to TikTok for kids aged 3–8. Free on Google Play and the App Store." />
    </div>
  );
}
