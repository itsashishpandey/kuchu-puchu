// "How to draw Kuchu & Puchu" on /drawing-for-kids: each step is a small SVG (shapes and texts in
// src/lib/drawing-guide.ts). All text and drawings are in the server HTML.
import * as Icons from "lucide-react";
import { DRAWING_GUIDES, drawingSvg } from "@/lib/drawing-guide";

export const COLORING_PAGE = "/images/kuchu-puchu-coloring-page.svg";

export function DrawingGuide() {
  return (
    <section className="bg-white py-14 md:py-20" aria-labelledby="drawing-guide">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 id="drawing-guide" className="reveal mx-auto max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink md:text-[2.4rem]">
          How to Draw Kuchu &amp; Puchu (Easy, Step by Step)
        </h2>
        <p className="reveal mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Kuchu and Puchu are the two kids in the Kuchu Puchu app icon. Grab a pencil, some crayons and a sheet of paper:
          each step adds a few simple shapes (the new lines are in red), and the last step shows the colours.
        </p>

        {DRAWING_GUIDES.map(g => (
          <div key={g.id} className="mt-12">
            <h3 id={`draw-${g.id}`} className="reveal font-display text-2xl font-bold text-ink">
              How to Draw {g.name}, {g.who}
            </h3>
            <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {g.steps.map((s, i) => (
                <li key={s.title} className="reveal bento flex flex-col p-3">
                  <svg viewBox="0 0 200 220" role="img" aria-label={`${g.name}, step ${i + 1}: ${s.title}`}
                    className="aspect-[200/220] w-full rounded-xl bg-surface"
                    dangerouslySetInnerHTML={{ __html: drawingSvg(g.shapes, i + 1) }} />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-red">Step {i + 1}</p>
                  <h4 className="font-display text-sm font-bold text-ink">{s.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}

        <div className="reveal mt-12 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-blue-soft to-brand-pink-soft p-6 text-center md:flex-row md:text-left">
          <Icons.Printer size={36} className="shrink-0 text-brand-blue" aria-hidden />
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-ink">Free Kuchu &amp; Puchu Coloring Page</h3>
            <p className="mt-1 text-sm text-muted-foreground">Print the outline of Kuchu and Puchu and let your child colour them in any colours they like.</p>
          </div>
          <a href={COLORING_PAGE} target="_blank" rel="noopener" className="grad-btn inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white">
            <Icons.Download size={16} aria-hidden /> Open the coloring page
          </a>
        </div>
      </div>
    </section>
  );
}
