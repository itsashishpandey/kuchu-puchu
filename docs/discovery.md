# Languages, categories, personalised feeds & YouTube-style channels

What was built for the "100 languages / 30 categories / smart tagging / recommendations" spec, plus
the YouTube-style channel pages. The design and API contracts are in `docs/discovery-plan.md`; this is the
operating guide.

## In one minute

- **104 languages** (the spec's list; its second "Punjabi" is Western Punjabi in Shahmukhi script).
  Public copy says "100+ languages".
- **Kids only, ages 3–8** (since 2 Nov 2026): **15 kids categories / 82 subcategories** (Cartoons &
  Animation, Rhymes & Songs, Stories & Fairy Tales, Early Learning, Science & Nature, Animals, Arts &
  Crafts, Dance & Movement, Kids Comedy, Toys & Play, Our World, Good Habits & Feelings, Kids Cooking,
  Learn Languages, Sports & Outdoor Play). The 31 earlier general-audience categories are retired, never
  deleted; see "Kids-only platform" below.
- Every video has **one primary language + up to 2 more**, and **1–3 distinct category › subcategory pairs**
  (the first is primary). These are validated in the server, in the database (CHECK constraints + triggers)
  and in the forms.
- A video is still **one content ID, one upload reward, one payment per qualified view**, however many
  categories it is in. Editing tags never changes the ID, views, earnings or reward.
- Viewers and creators go through a **4-step onboarding**. It saves progress if interrupted, is never
  forced twice, and can all be changed later in *My Interests & Languages*.
- **For You** ranks videos by subcategory 40 / category 25 / engagement 20 / recency 10 / discovery 5:
  - Language is an eligibility rule: other languages appear only if the viewer turns discovery on.
  - If there's no exact match it falls back: same subcategory → same category → other categories in the
    viewer's languages → other languages (opt-in).
  - Watched, "not interested", blocked creators and reported videos are excluded or lowered, with at most
    2 videos per creator per page.
  - What a creator is paid never affects ranking.
- **Search** reads languages and categories out of plain text. "Hindi nursery rhymes" becomes
  Hindi + Rhymes & Songs › Nursery Rhymes as removable chips. Typos only produce "Did you mean …?".
- **Channels work like YouTube:**
  - The channel page has a banner, round logo, name, @username, tagline, followers · videos, a Follow
    button, and Home / Videos / About tabs. The About tab has the support email, links, country, join
    date and total views.
  - Creators get **Customize channel** and a **Followers** page (count, list with name + country,
    countries, new followers per day).

## Where things are

| Area | Code |
|---|---|
| Database | `prisma/schema.prisma`, `prisma/migrations/0001_baseline`, `0002_discovery`, `0003_channel_profile` |
| Languages / categories data | `prisma/discovery-data.mjs` (seed source), `prisma/seed-discovery.mjs` (idempotent seed + backfill) |
| Migrate an existing DB | `prisma/migrate-deploy.mjs` (`npm run db:migrate:deploy`) |
| Pure logic (unit-tested) | `src/lib/discovery/` — `tag-validation`, `rank`, `search-parse`, `suggest`, `reco-config`, `text` |
| Server helpers | `src/lib/taxonomy.ts`, `feed.ts`, `search.ts`, `preferences.ts`, `video-tags.ts`, `video-dto.ts`, `interactions.ts`, `channel-prefs.ts`, `discovery-admin.ts` |
| APIs | `/api/taxonomy/*`, `/api/public/videos` (`feed=foryou\|trending\|explore\|following`), `/api/search`, `/api/me/*`, `/api/social/<action>/<id>`, `/api/creator/*`, `/api/admin/discovery/*` |
| Website | `src/components/discovery/*` (onboarding, settings, search, saved, video grid), `feed/video-feed.tsx`, `marketing/explore.tsx`, `marketing/home-discovery.tsx`, `marketing/creator-channel.tsx`, `dashboard/channel-studio.tsx`, `dashboard/upload-videos.tsx`, `shared/video-tag-editor.tsx` |
| Admin (7 pages) | `src/components/admin/discovery/*` → *Content Discovery & Personalization* menu group |
| Android app | `mobile/` (v1.2.0) |

## Admin: Content Discovery & Personalization

| Page | Who | What |
|---|---|---|
| Languages | Super admin, Moderator | Language / Code / Status / Videos / Viewers / Total Views; add, edit, activate/deactivate |
| Main Categories | Super admin, Moderator | Edit, emoji, colour, cover, Hindi name, reorder, activate/deactivate, retire/restore, merge, performance by language |
| Subcategories | Super admin, Moderator | Same as Main Categories, per category; merge into any subcategory |
| Video Tag Review | Super admin, Moderator | Queue of NEEDS_REVIEW / FLAGGED videos; approve, flag (creator notified), correct (creator notified) |
| User Interest Analytics | All admins | Counts only: onboarding, discovery opt-in, popular languages/categories, content gaps |
| Recommendation Settings | Super admin | Weights within safe limits, versions, experiments (% of viewers), revert, live preview |
| Content Discovery Reports | All admins | By language / category / subcategory, completion, feedback, top and zero-result searches, audit log |

Every change is written to `TaxonomyAuditLog` with before/after snapshots. Merges move videos, viewer
interests and channel preferences; the source is retired, never deleted.

## Privacy choices

- Guest language choice stays on the device and is only sent as the `languages=` filter.
- Interaction events store no IP or text. Views keep only a hashed device key and the Cloudflare
  *country* code.
- **Follower lists** show the follower's name and the country *they chose in their own profile* — never
  a city or anything inferred from their location. Any viewer can switch on "keep my follows private"
  (*My Interests & Languages → Following & privacy*). They then appear as "Private follower" and still
  count. This mirrors YouTube's public/private subscriptions. The default is **visible**; to make
  follows private by default, change `followsPrivate @default(false)` to `true` in a new migration.
- The support email on a channel is optional and public. The website reveals it on click, which slows
  scrapers down.

## Tests

```bash
npm test                                   # 28 unit tests for the pure modules (node --test)
# end-to-end acceptance (spec Tests 1–11) — ALWAYS against a scratch copy of the database:
DATABASE_URL=file:/tmp/scratch.db BASE=http://127.0.0.1:5055 CLIPS=/dir/with/clips node tests/e2e/discovery.e2e.mjs
```

The e2e script needs three unique 40–60 s clips named `e2e_hi.mp4`, `e2e_bn.mp4` and `e2e_mis.mp4`.
Make them with ffmpeg, e.g.
`ffmpeg -f lavfi -i testsrc2=size=720x1280:rate=24:duration=45 -f lavfi -i sine=frequency=330:duration=45 -shortest e2e_hi.mp4`.
It logs in as the demo admin and the creators Meera and Aarav, uploads, approves, sends 1,000
qualified views, and checks the database directly.

Last run (2 Nov 2026): 12/12 passed. Test 12 (mobile) was checked at 375 px: registration, onboarding,
upload, settings, feed, explore, search, channel and creator pages have no horizontal scroll.

## Known limits / next steps

- The interface itself is English. Category and subcategory names can be shown in Hindi (all 31
  categories are translated); admins can add more locales and names. Translating the full UI is a
  separate project.
- Language and category suggestions use the title, description and hashtags. There is no speech or
  transcript analysis.
- Demo channels have large illustrative follower counts but few real follow records, so their follower
  lists start short. Real follows appear as they happen.
- Ranking runs in-process with a 5-minute per-viewer cache, which is fine for one PM2 instance. A
  multi-instance setup would need a shared cache.

## Creator application, ID checks and strikes (added 2 Nov 2026)

**Applying (website `#/register`; app 1.3.0) — 5 steps**

1. **Email.** A 6-digit code is sent by email (`POST /api/auth/email-otp`, then `/verify`). The code:
   - is stored as a hash only;
   - expires after 10 minutes and allows 5 attempts;
   - can be resent after 60 seconds, at most 5 times an hour.
   The verified token is good for 30 minutes and works once.
2. **About you.** Legal name (as on the ID), phone with country code, password, country, city and PIN /
   postal code. In India the PIN must be 6 digits.
3. **Channel.**
   - Channel name and username: letters and numbers only, 6–20 characters, can't be changed later.
   - Profile picture (required), main category, up to 3 languages and a description.
   - "Already a creator on Instagram/YouTube?" If yes, at least one valid profile link is required.
4. **Government ID.** The type (Aadhaar / PAN / Voter ID for India; passport, driving licence or
   national ID anywhere), the last 4 characters of the number, and one JPG/PNG/WebP/PDF up to 8 MB.
   - The file type is checked from its contents, not its name.
   - The file is stored in `~/mykuchupuchu-data/private/kyc`, which is **never web-served**.
   - Admins open it only through `/api/admin/creators/<id>/document`, and every view is written to the
     audit log.
5. **Rules.** Five separate checkboxes are stored with a version and time: responsible for my content,
   takedown on complaint, 3 strikes, 18+, and terms.

Rules and texts come from `GET /api/public/creator-application`. They live in
`src/lib/creator-application.ts` and are shared by the website and the app.

**Admin → Creator Management → "Application & trust"** shows the application details, View ID
(logged), Verify / Not valid, strikes (+ Strike / Remove) and monetization progress. Approving a creator
also marks a pending ID as verified.

**Strikes** (`src/lib/strikes.ts`)
- Each upheld complaint is a strike. Admins add one with Safety → "Remove + strike",
  Video → remove with `strike: true`, or "+ Strike" on the creator.
- **3 active strikes suspend the channel automatically** and sign it out everywhere. Deleting the
  channel stays an admin decision.
- Strikes can be removed after an appeal. The creator is notified at every step and sees
  "Channel standing" in the dashboard.

**Email.** On the server, mail goes out through cPanel Exim (`/usr/sbin/sendmail -f
support@mykuchupuchu.com`); SPF and DKIM are set up for the domain. Locally there is no mail server,
so the code is written to Admin → Mail log. On live, the log hides the code.

## Monetization rules (added 2 Nov 2026)

- **Upload reward:**
  - It is ₹30, set in INR in Admin → Monetization Settings with an exchange rate (default ₹95 = $1).
  - The ledger pays the USD amount: ₹30 ÷ 95 = $0.32.
  - Older settings versions keep their USD values.
- **Monetization unlock (one-time):**
  - A channel starts earning (upload rewards *and* view earnings) the **first time it has 2,500 genuine
    views within 30 days**, and then stays unlocked for good. The date is stored in
    `User.monetizationUnlockedAt`, and the creator gets a "🎉 Monetization unlocked" notification.
  - Admins can change the number. They can also Unlock now / Lock a channel by hand from Creator Management.
  - Channels that had already earned before this rule were unlocked at their first earning (migration 0006).
  - Self-views, bots, refresh spam above the daily cap, sub-2-second plays and views of unpublished
    videos don't count.
  - Views blocked only because a channel is still locked are logged as `CHANNEL_BELOW_VIEW_THRESHOLD`.
    They still count toward the target.
  - Uploads approved before a channel unlocks get no upload reward.
- Locked creators see a progress bar ("1,240 / 2,500 views in the last 30 days"), and unlocked ones see "Earning is on". Admins see the status for each creator.
- New creators start locked.

## Kids-only platform, ages 3–8 (added 2 Nov 2026)

My Kuchu Puchu is only for children aged 3–8. That range maps to Google Play's "Ages 5 & under" and
"Ages 6–8" target audiences. The rules are in `src/lib/kids.ts` (`KIDS_AUDIENCE` lives in
`prisma/discovery-data.mjs`), and `/api/public/settings` returns them as `audience`.

- **Taxonomy conversion** (`applyKidsTaxonomy` in `prisma/seed-discovery.mjs`) runs once from
  `migrate-deploy.mjs` and is guarded by the PlatformSetting flag `kidsTaxonomy`. It does four things:
  - reuses old kids rows by slug or name;
  - moves the old Kids & Cartoons subcategories to their new homes (`LEGACY_KIDS_MAP`);
  - retires every non-kids category, removes those tags from videos (or sends a video to review if it had
    no kids tag left) and drops viewer interests in them.
  - Live result: 31 categories retired, 17 videos moved, 0 needing review.
- **Comments are off:** POST comment → 403, comments are never returned publicly, and the comment UI is
  gone from the web and the app. Older comments stay in the admin "Reports & Comments" page for moderation.
- **Accounts are for parents (18+) and creators (18+).** Kids watch without an account. Viewer sign-up
  needs `parentConfirm=true`.
- **Every upload** needs `kidsSafeDeclaration=true` and goes through human review
  (`UploadRule.requireVideoApproval` must stay **true**; the privacy policy and guidelines promise it).
  The creator rules gain a "kids" agreement (`AGREEMENTS_VERSION 2026-11-02-kids`).
- **App 1.5.0 is watch-only** (owner's decision, 2 Nov 2026): it opens straight into a playing video, with
  no login, no sign-up and no creator features. Creators apply, upload and get paid on the website only.
  Languages, likes and watch history are kept on the device. An "Ask a grown-up" parental gate (type a
  number written in words) sits in front of the grown-ups' settings, every outside link, share and report.
  The app has no AD_ID permission and no ad or analytics SDKs. (App 1.4.0 still had parent login and the
  creator studio behind the gate.)
- **Account deletion** (Play/App Store rule): `POST /api/me/delete-account {password, confirm:"DELETE"}`.
  - Parents are deleted completely.
  - Creators are anonymised: channel and videos removed, ID document deleted, and only anonymous ledger
    rows are kept for 7 years. An open withdrawal blocks it (409).
  - It's available in the app, at `/#/delete-account` and in creator settings, and explained at the
    plain page `/account-deletion`.
- **Plain, server-rendered policy pages** for store forms and crawlers: `/privacy`, `/terms`,
  `/community-guidelines`, `/account-deletion`. The text is in `src/lib/policies-data.ts` and is shared with
  `#/policies/<slug>`.
- Store submission steps: `docs/store-submission.md`.
