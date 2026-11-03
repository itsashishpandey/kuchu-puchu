import type { Metadata } from "next";
import { StaticPolicy } from "@/components/marketing/static-policy";

export const metadata: Metadata = { title: "Delete Your Account", alternates: { canonical: "/account-deletion" } };

// The web link for Google Play's account-deletion requirement. The form itself lives at /#/delete-account.
export default function Page() {
  return (
    <StaticPolicy>
      <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Delete your Kuchu Puchu account</h1>
      <p className="mt-4 text-base leading-relaxed">
        Kids watch Kuchu Puchu without an account, and the Kuchu Puchu app has no accounts at all. Parent and
        creator accounts exist only on the website, and can be deleted there at any time, immediately and permanently.
      </p>
      <h2 className="mt-8 font-display text-lg font-bold">How to delete</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] text-ink/80">
        <li><strong>On the web:</strong> <a href="/#/delete-account" className="font-semibold text-brand-red hover:underline">log in and delete your account here</a>.</li>
        <li><strong>By email:</strong> write to support@mykuchupuchu.com from the address on the account; we delete it within 7 days.</li>
      </ol>
      <h2 className="mt-8 font-display text-lg font-bold">What is deleted</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-ink/80">
        <li><strong>Parent accounts:</strong> everything — name, email, password, saved videos, likes, follows, languages and interests.</li>
        <li><strong>Creator accounts:</strong> channel, all videos, ID document and personal details (name, email, phone, city, PIN). Any unpaid balance is forfeited.</li>
      </ul>
      <h2 className="mt-8 font-display text-lg font-bold">What is kept</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/80">
        For creators only: anonymous earnings, ledger and payout records, kept for 7 years because accounting law requires it.
        They are no longer linked to your name or email.
      </p>
    </StaticPolicy>
  );
}
