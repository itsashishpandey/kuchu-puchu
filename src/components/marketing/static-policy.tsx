// Plain server-rendered policy page (no JavaScript needed) for store reviewers, crawlers and links
// from the app: /privacy, /terms, /community-guidelines, /account-deletion.
import { POLICIES, type Policy } from "@/lib/policies-data";

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/account-deletion", label: "Delete your account" },
];

export function StaticPolicy({ policy, children }: { policy?: Policy; children?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-ink md:py-16">
      <a href="/" className="text-sm font-bold text-brand-red hover:underline">← Kuchu Puchu</a>
      {policy && (
        <>
          <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">{policy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{policy.updated}</p>
          <p className="mt-4 text-base leading-relaxed">{policy.intro}</p>
          {policy.sections.map(s => (
            <section key={s.h} className="mt-8">
              <h2 className="font-display text-lg font-bold">{s.h}</h2>
              {s.p.map((t, i) => <p key={i} className="mt-2 text-[15px] leading-relaxed text-ink/80">{t}</p>)}
              {s.list && <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink/80">{s.list.map(x => <li key={x}>{x}</li>)}</ul>}
            </section>
          ))}
        </>
      )}
      {children}
      <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6 text-sm" aria-label="Policies">
        {LINKS.map(l => <a key={l.href} href={l.href} className="font-semibold text-brand-blue hover:underline">{l.label}</a>)}
      </nav>
      <p className="mt-4 text-xs text-muted-foreground">Questions? support@mykuchupuchu.com</p>
    </main>
  );
}

export const policy = (slug: keyof typeof POLICIES | string) => POLICIES[slug];
