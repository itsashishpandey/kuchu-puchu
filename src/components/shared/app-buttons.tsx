"use client";

// "Get the app" buttons for Android and iPhone, used three times on every public page.
// The store links aren't ready yet: while a link below is null its button shows "Coming soon" and
// can't be clicked. Add the link here and every button on the site becomes a real download link.
import { ANDROID_APK_URL, ANDROID_APK_NOTE } from "@/components/shared/ui-bits";

export const APP_LINKS: { android: string | null; ios: string | null } = {
  android: null, // e.g. the Google Play listing
  ios: null,     // e.g. the App Store listing
};

function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.52 15.34a1 1 0 1 1 0-2.01 1 1 0 0 1 0 2.01m-11.04 0a1 1 0 1 1 0-2.01 1 1 0 0 1 0 2.01m11.4-6.02 2-3.47a.42.42 0 0 0-.72-.42l-2.03 3.52A12.5 12.5 0 0 0 12 7.84c-1.84 0-3.58.4-5.13 1.1L4.83 5.43a.42.42 0 0 0-.72.42l2 3.47C2.67 11.19.33 14.66 0 18.74h24c-.33-4.08-2.67-7.55-6.12-9.42" />
    </svg>
  );
}

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.93-.99 1.84 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.32 1.66-3.41-.04-.02-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.15-3.68 1.09-4.61 1.09zM15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7" />
    </svg>
  );
}

const STORES = [
  { key: "android" as const, platform: "Android", Glyph: AndroidGlyph },
  { key: "ios" as const, platform: "iPhone", Glyph: AppleGlyph },
];

/** The two app buttons. `tone="dark"` is for dark backgrounds. */
export function AppButtons({ tone = "light", className = "", align = "start" }: {
  tone?: "light" | "dark"; className?: string; align?: "start" | "center";
}) {
  const base = `inline-flex h-14 min-w-[11.5rem] items-center gap-3 rounded-2xl px-4 text-left shadow-md ring-1 transition ${
    tone === "dark" ? "bg-white text-ink ring-white/20" : "bg-ink text-white ring-black/10"
  }`;
  return (
    <div className={`flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""} ${className}`}>
      {STORES.map(({ key, platform, Glyph }) => {
        const href = APP_LINKS[key];
        const inner = (
          <>
            <Glyph className="h-7 w-7 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold opacity-75">{href ? "Download for" : "Coming soon for"}</span>
              <span className="font-display text-lg font-bold">{platform}</span>
            </span>
          </>
        );
        return href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={`${base} hover:-translate-y-0.5`}
            aria-label={`Download the Kuchu Puchu app for ${platform}`}>
            {inner}
          </a>
        ) : (
          <span key={key} role="link" aria-disabled="true" title="Coming soon" className={`${base} cursor-default select-none`}
            aria-label={`Kuchu Puchu app for ${platform}: coming soon`}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

/** The small working link to the Android app file, until the store listing is live. */
export function ApkTextLink({ className = "", tone = "light", note = false }: { className?: string; tone?: "light" | "dark"; note?: boolean }) {
  return (
    <p className={`text-xs ${tone === "dark" ? "text-white/55" : "text-muted-foreground"} ${className}`}>
      or{" "}
      <a href={ANDROID_APK_URL} download className={`font-semibold underline underline-offset-2 ${tone === "dark" ? "text-white/80" : "text-brand-blue"}`}>
        download the Android APK file
      </a>
      {note ? <> · {ANDROID_APK_NOTE}</> : null}
    </p>
  );
}

/** A full-width "get the app" band: heading, a line of text and the two buttons. */
export function AppCtaBand({ heading, text, tone = "light", as: Heading = "h2" }: {
  heading: string; text: string; tone?: "light" | "dark"; as?: "h2" | "h3";
}) {
  const dark = tone === "dark";
  return (
    <section className={`relative overflow-hidden py-14 md:py-20 ${dark ? "bg-ink" : "bg-gradient-to-br from-brand-blue-soft via-white to-brand-pink-soft"}`}
      aria-label="Get the Kuchu Puchu app">
      {dark && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-red/25 blur-3xl" />
          <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-brand-blue/25 blur-3xl" />
        </div>
      )}
      <div className="reveal relative mx-auto max-w-3xl px-4 text-center md:px-6">
        <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${dark ? "bg-white/10 text-brand-yellow" : "bg-white text-brand-blue ring-1 ring-brand-blue/20"}`}>
          Free app · No ads · Ages 3–8
        </span>
        <Heading className={`font-display text-3xl font-bold leading-tight md:text-4xl ${dark ? "text-white" : "text-ink"}`}>{heading}</Heading>
        <p className={`mx-auto mt-3 max-w-xl ${dark ? "text-white/70" : "text-muted-foreground"}`}>{text}</p>
        <AppButtons tone={dark ? "dark" : "light"} align="center" className="mt-7" />
      </div>
    </section>
  );
}
