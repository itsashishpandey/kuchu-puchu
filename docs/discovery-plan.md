# My Kuchu Puchu — Languages, Categories & Personalization: implementation plan

Source: `Downloads\Guidelines.txt` (Master Development Prompt). Decisions confirmed with the owner:
**31 main categories** (the 30 specified + "Kids & Cartoons" holding today's 12 kids categories as
subcategories) and **current brand colours** (pink/blue/yellow) everywhere.

Other decisions (defaults, open to change):
- **Languages: 104**, as the detailed list specifies. Punjabi appears twice in the list; the second
  entry is seeded as **Western Punjabi (Shahmukhi, `pnb`, right-to-left)** — a real, distinct variant —
  so the catalogue has exactly 104 unique languages. Public copy says "100+ languages".
- **Interface languages:** English + Hindi to start. The interface-language setting localizes category
  names (Hindi names seeded for all 31 categories; subcategory translations editable by admins) and the
  onboarding/settings screens. Translating the entire website UI is a separate project.
- **Language/category suggestions** use the title, description and hashtags (script detection +
  keyword matching). There is no speech-to-text, so transcripts aren't analysed. Suggestions are never
  applied automatically.
- **Existing demo videos** are backfilled by hand-reviewed mapping (language English — titles/on-screen
  text; music-only audio) into Kids & Cartoons + 1–2 general categories, marked *Needs review* so an
  admin confirms them in Video Tag Review.

## Architecture

### Database (Prisma + SQLite, versioned migrations)
Switch from `db push` to `prisma migrate`: `0001_baseline` (today's schema, marked applied on existing
DBs) + `0002_discovery`. All changes additive; nothing dropped.

New tables: `Language`, `Subcategory`, `CategoryTranslation`, `UserLanguagePreference`,
`UserCategoryPreference`, `UserSubcategoryPreference`, `UserRecommendationPreference`, `VideoLanguage`,
`VideoCategoryAssignment`, `ChannelCategoryPreference`, `ChannelLanguage`, `SavedVideo`,
`VideoFeedback` (not interested), `BlockedCreator`, `VideoInteractionEvent`, `RecommendationConfig`,
`TaxonomyAuditLog`, `SearchLog`. Extended: `Category` (sort order, emoji, colour, cover, retire/merge),
`Video` (tag review status, suggestions), `ViewEvent` (+userId, +country, +durationSeconds),
`ContentReport` (+userId).

Integrity rules enforced in the database, not only in code:
- `VideoCategoryAssignment`: unique (video, category) + unique (video, priority) + `CHECK priority 1–3`
  ⇒ at most 3 distinct main categories per video.
- `VideoLanguage`: unique (video, language) + unique (video, position) + `CHECK position 1–3`
  (position 1 = primary).
- Subcategory must belong to the assigned category (validated in the same transaction).

### Server logic (`src/lib/discovery/*` pure + `src/lib/*` DB wrappers)
- `taxonomy` — cached loaders (languages, categories with translations), invalidated on admin edits.
- `tag-validation` — 1–3 distinct categories, valid parent–child, active only, 1 primary + ≤2 extra languages.
- `suggest` — script-based language detection + keyword/synonym category suggestions.
- `rank` — For You scoring with admin-configurable weights (subcategory 40 / category 25 /
  engagement 20 / recency 10 / discovery 5), language eligibility, fallback cascade
  (exact sub+lang → category+lang → other categories same lang → enabled discovery languages),
  creator cap per page, watched/not-interested/blocked handling, follow boost, new-creator discovery,
  experiment bucketing, no monetization signal.
- `search` — query interpretation ("Hindi husband wife jokes" → language Hindi + subcategory
  Husband & Wife Jokes under Comedy & Jokes), typo suggestions shown, never silently applied.

### API contracts (all JSON; errors `{ error }`)
Taxonomy (public, cached):
- `GET /api/taxonomy/languages` → `{ languages: [{ id, code, nameEn, nameNative, script, direction, group, popular, priority }] }`
- `GET /api/taxonomy/categories?locale=en|hi` → `{ locale, categories: [{ id, slug, name, nameEn, description, emoji, color, coverImageUrl, sortOrder, videoCount, subcategories: [{ id, slug, name, nameEn, emoji, sortOrder, videoCount }] }] }`

Videos (backward compatible — old app keeps working):
- `GET /api/public/videos?feed=foryou|trending|explore|following&languages=hi,en&category=<slug>&subcategory=<slug>&q=&limit=&offset=`
  → `{ videos: [VideoDTO], nextOffset, meta: { feed, languages: [codes], tier, emptyReason } }`
- `VideoDTO` = existing fields + `languages: [{ code, nameEn, nameNative, isPrimary }]`,
  `tags: [{ priority, category: { id, slug, name, emoji, color }, subcategory: { id, slug, name } }]`, `saved`.
  `category` (string) stays = primary category name.
- `GET /api/search?q=&languages=&category=&subcategory=&limit=&offset=` → `{ query, interpretation: { languages, category, subcategory, text, suggestions }, videos, creators, nextOffset }`

Viewer preferences & feedback (login required):
- `GET /api/me/preferences` / `PUT /api/me/preferences` `{ languages: [codes], primaryLanguage, categories: [{ id, allSubcategories }], subcategoryIds, discoverOtherLanguages, interfaceLocale, completeOnboarding }`
- `PATCH /api/me/onboarding` `{ step, draft }` (resume interrupted onboarding)
- `POST /api/me/recommendations/reset`, `GET /api/me/saved`, `GET /api/me/not-interested`, `GET /api/me/blocked-creators`
- `POST /api/social/save/:videoId`, `POST /api/social/not-interested/:videoId` `{ undo }`, `POST /api/social/hide-creator/:creatorUserId` `{ undo }`
- `POST /api/social/view/:videoId` `{ watchSeconds, durationSeconds }` (adds completion, user, country; earnings logic unchanged)

Creator:
- Upload adds multipart `languages` = `{"primary":"hi","additional":["en"]}` and `tags` = `[{"categoryId":"…","subcategoryId":"…"}]` (order = priority).
- `GET /api/creator/tag-suggestions?title=&description=&hashtags=`
- `PATCH /api/creator/videos/:contentId/tags` `{ languages, tags }` — same content ID, monetization untouched, audit-logged, goes to tag review if the video is live.
- Analytics adds `breakdowns: { byLanguage, byCategory, bySubcategory, byCountry, completion, primaryAttribution }`.
- Channel adds `preferredCategoryIds`, `languageCodes`.

Admin (`/api/admin/discovery/...`, audit-logged): languages, categories, subcategories (create/edit/
order/activate/retire/merge with redirect of videos + user interests), translations, video tag review,
interest analytics, recommendation settings (versioned, experiment %, revert), discovery reports.
Permissions: Super admin all; Moderator taxonomy + tag review + analytics; Finance read-only analytics.

### Website
Viewer sign-up on the web (`#/join`), 4-step onboarding (`#/onboarding`, resumable), Settings → My
Interests & Languages, For You/Following/Trending with language filter and Save / Not interested /
Don't recommend this creator, category explorer (`#/explore/<category>` with subcategory chips +
language chips, combinable, no page reload), unified search with interpretation chips, saved videos,
upload form with language + up to 3 category rows + suggestions, My Videos tags + edit, analytics
breakdowns, channel preferences, homepage sections ("Discover Videos in Your Language",
"Something for Every Interest"), admin group "Content Discovery & Personalization" (7 pages).

### Android app
Same flows natively: onboarding after sign-up / for existing users (skippable once), settings screen,
For You personalized, language filter, save / not interested / hide creator, saved list, category
explorer + search interpretation, upload language + 3 categories + suggestions, edit tags, channel
preferences, guest language choice kept on the device only.

### Monetization compatibility (unchanged rules, verified by tests)
One video = one content ID, one set of view events, at most one upload reward, one payment per
qualified view, one publication/expiry date — regardless of how many categories it has.

### Fixes to existing bugs found during review
Website social calls 404 (views/likes/comments/follows/shares/reports from the website never counted);
broken category filter on web Explore/homepage; Finance/Moderator could create super-admins;
per-query logging in production; video detail endpoint leaking fingerprints.

## Delivery order
1. Database: migrations, schema, seed (104 languages, 31 categories, ~420 subcategories), backfill.
2. Core logic + unit tests. 3. APIs. 4. Website + Android app (in parallel). 5. Acceptance tests 1–12.
6. Deploy to mykuchupuchu.com with a database backup, publish the new APK, docs.
