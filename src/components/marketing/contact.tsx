"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "@/components/shared/ui-bits";
import { AppButtons, AppCtaBand } from "@/components/shared/app-buttons";
import { useReveal } from "@/components/app/router";
import { post } from "@/lib/client";
import { toast } from "@/hooks/use-toast";
import { FaqList } from "./home-parents";

const SUPPORT_CATEGORIES = [
  { id: "CREATOR_SUPPORT", icon: Icons.UserRoundCheck, title: "Creator support", desc: "Applications, approvals, channel settings and upload issues.", sla: "Within 1 business day" },
  { id: "PAYMENTS", icon: Icons.Banknote, title: "Payment support", desc: "Withdrawals, payout methods, bank details and payment references.", sla: "Within 1 business day" },
  { id: "POLICY", icon: Icons.Scale, title: "Policy & safety", desc: "Community guidelines, duplicate flags, appeals and copyright reports.", sla: "Within 2 business days" },
  { id: "TECHNICAL", icon: Icons.Wrench, title: "Technical issues", desc: "Playback problems, upload errors, bugs and account access.", sla: "Within 2 business days" },
];

const CONTACT_FAQS = [
  { q: "How do I report a video on Kuchu Puchu?", a: "Tap Report on the video in the Kuchu Puchu app (a grown-ups check comes first) or on the website. You can also email support@mykuchupuchu.com with the video's ID (VID-…). Our team reviews every report." },
  { q: "Is Kuchu Puchu free for my child?", a: "Yes. The Kuchu Puchu app and website are free, with no subscription, nothing to buy and no ads. Kids watch without an account." },
  { q: "How do I delete my account and data?", a: "Follow the steps on our account deletion page (mykuchupuchu.com/account-deletion), or email support@mykuchupuchu.com from the address on your account and we'll delete it for you." },
  { q: "How long does creator application review take?", a: "Usually within 2 business days. You'll get an in-app notification and an email the moment your status changes — approved, rejected (with reason) or questions." },
  { q: "My withdrawal is stuck in 'Processing' — what now?", a: "Bank payouts take 3–5 business days after approval; PayPal typically 1–3. If it exceeds that, contact payment support with your payment reference (PAY-…) and we'll trace it." },
  { q: "How do I appeal a duplicate flag?", a: "Open My Videos in your dashboard, find the flagged video and click 'Submit appeal'. Reviews complete within 2 business days and rewards are credited if cleared." },
  { q: "Can I change my payout method?", a: "Anytime, from Dashboard → Account Settings → Payment details. Pending withdrawals keep the method used at request time." },
];

export function ContactPage() {
  const setRef = useReveal<HTMLDivElement>();
  const [form, setForm] = useState({ name: "", email: "", category: "CREATOR_SUPPORT", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await post<{ message: string }>("/public/contact", form);
      toast({ title: "Message sent ✅", description: res.message });
      setSent(true);
      setForm({ name: "", email: "", category: "CREATOR_SUPPORT", subject: "", message: "" });
    } catch (err) {
      toast({ title: "Couldn't send", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={setRef}>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-blue/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-red/25 blur-3xl" aria-hidden />
        <div className="reveal relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-yellow ring-1 ring-white/15">
            <Icons.Headset size={13} /> Contact us
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Contact Kuchu Puchu: <span className="grad-text">Help for Parents &amp; Creators</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            A question about the Kuchu Puchu app, a video your child watched, or your creator account? Write to us.
            Real people read every message and we aim to answer within a day.
          </p>
          <AppButtons tone="dark" align="center" className="mt-8" />
        </div>
      </section>

      {/* 2. Contact form */}
      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="reveal bento p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold">Send us a message</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Fill in the form and the right team will get back to you.</p>
            {sent && (
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
                <Icons.CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Message received!</p>
                  <p className="mt-0.5 text-emerald-700">A confirmation is in your inbox. We reply within one business day.</p>
                </div>
              </div>
            )}
            <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="c-name">Full name</Label>
                <Input id="c-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alex Rivera" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>Support category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATOR_SUPPORT">Creator support</SelectItem>
                    <SelectItem value="PAYMENTS">Payment support</SelectItem>
                    <SelectItem value="POLICY">Policy & safety</SelectItem>
                    <SelectItem value="TECHNICAL">Technical issues</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-subject">Subject</Label>
                <Input id="c-subject" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="c-message">Message</Label>
                <Textarea id="c-message" required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us what's going on. Include video IDs (VID-…) or payment references (PAY-…) if relevant." className="rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy} className="grad-btn h-12 w-full rounded-xl text-white sm:w-auto sm:px-10">
                  {busy ? "Sending…" : "Send message"} <Icons.Send size={16} className="ml-2" />
                </Button>
              </div>
            </form>
          </div>

          {/* 3. Support categories */}
          <div className="space-y-3">
            {SUPPORT_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setForm(f => ({ ...f, category: c.id }))}
                className={`reveal bento flex w-full items-start gap-4 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${form.category === c.id ? "ring-2 ring-brand-red" : ""}`}
              >
                <span className="rounded-xl bg-brand-red-soft p-3"><c.icon size={22} className="text-brand-red" /></span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-bold">{c.title}</h3>
                    <span className="whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{c.sla}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AppCtaBand heading="Get the Kuchu Puchu App" text="Free learning videos for kids aged 3–8, with no ads, no comments and no sign-up for kids." />

      {/* 4. Creator support spotlight */}
      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="reveal bento grid items-center gap-8 p-8 md:grid-cols-[1fr_auto] md:p-10">
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-blue-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue">
                <Icons.UserRoundCheck size={13} /> Creator support
              </span>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Prefer talking to a person?</h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Approved creators get priority support straight from the dashboard — the Notifications and
                Account Settings pages link directly to creator-specific help, and payout questions skip the queue.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: Icons.Mail, label: "creators@mykuchupuchu.com", sub: "Creator-only priority lane" },
                { icon: Icons.MessageCircle, label: "In-dashboard help", sub: "Dashboard → Notifications → Get help" },
              ].map(x => (
                <div key={x.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <span className="rounded-lg bg-brand-blue-soft p-2.5"><x.icon size={18} className="text-brand-blue" /></span>
                  <div>
                    <p className="text-sm font-bold">{x.label}</p>
                    <p className="text-xs text-muted-foreground">{x.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Payment support spotlight */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="reveal grid gap-4 md:grid-cols-3">
            {[
              { icon: Icons.Banknote, t: "Payout status", d: "Every withdrawal shows its exact stage: Requested → Under Review → Approved → Processing → Paid, with references." },
              { icon: Icons.CreditCard, t: "Payment methods", d: "Bank transfer (ACH/SEPA) and PayPal. Details are validated and stored masked for your security." },
              { icon: Icons.Timer, t: "Timelines", d: "Bank payouts: 3–5 business days after approval. PayPal: 1–3. Stuck longer? We trace it for you." },
            ].map(x => (
              <div key={x.t} className="bento p-6">
                <span className="rounded-xl bg-brand-yellow-soft p-3"><x.icon size={22} className="text-brand-yellow" /></span>
                <h3 className="mt-4 font-display text-base font-bold">{x.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <SectionHeading eyebrow="Quick answers" title="Common support questions" />
          <FaqList items={CONTACT_FAQS} />
        </div>
      </section>

      {/* 7. Contact details */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Icons.Mail, t: "General", v: "support@mykuchupuchu.com", s: "All inquiries" },
              { icon: Icons.UserRoundCheck, t: "Creators", v: "creators@mykuchupuchu.com", s: "Priority lane" },
              { icon: Icons.Banknote, t: "Payments", v: "payments@mykuchupuchu.com", s: "Payout issues" },
              { icon: Icons.Scale, t: "Copyright", v: "copyright@mykuchupuchu.com", s: "Takedowns & disputes" },
            ].map(x => (
              <div key={x.t} className="bento p-5 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red-soft">
                  <x.icon size={19} className="text-brand-red" />
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{x.t}</p>
                <p className="mt-1 break-all text-sm font-bold">{x.v}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{x.s}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-8 flex items-center justify-center gap-2 rounded-2xl bg-secondary p-5 text-sm text-muted-foreground">
            <Icons.Clock size={16} className="text-brand-blue" />
            Support hours: Mon–Fri, 9:00–18:00 UTC · Typical first response: under 24 hours
          </div>
        </div>
      </section>

      <AppCtaBand tone="dark" heading="Download the Kuchu Puchu App"
        text="Cartoons, nursery rhymes, stories and ABC videos for kids, free and with no ads." />
    </div>
  );
}
