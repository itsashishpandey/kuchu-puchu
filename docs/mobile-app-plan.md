# My Kuchu Puchu — Android app plan

## Context

My Kuchu Puchu is a kids' short-video platform where creators earn from qualified views and approved
uploads. Today it exists only as a website (Next.js, running locally on port 5000). We want an
Android app (APK) with two kinds of accounts — **Creator** and **User** (viewer) — and **no admin
features** (admins keep using the website).

The audience is mostly kids, and most videos are AI cartoons, so the app must feel bright, playful
and cartoon-like, while keeping My Kuchu Puchu's colors and look. Structure and proven pieces are
borrowed from the **Reelxia** Flutter app (`C:\Claude\Reelxia\reelxia\app`).

For now the app talks to this PC's server over Wi-Fi; it will be rebuilt for the live domain later.

---

## 1. Look & feel — "playful cartoon"

| Element | Choice |
|---|---|
| Colors | My Kuchu Puchu palette: blue `#1677FF`, pink `#FF4E9B`, sunny yellow `#FFC531`, purple `#8B5CF6`; signature gradient blue → purple → pink; soft pastel backgrounds (`#E6F0FF`, `#FFE6F2`, `#FFF4D6`) |
| Fonts | **Baloo 2** for headings (round, friendly), **Nunito** for text — same as the website |
| Shapes | Extra-rounded cards (20–28 px), chunky pill buttons with a soft "3D" bottom shadow, big tap targets (≥ 48 px) |
| Motion | Bouncy button presses, heart-burst + confetti on like, wiggling category bubbles, floating balloon/star stickers on empty screens, animated splash with the app icon popping in |
| Art | The new app icon (boy + girl + play button) for launcher/splash; the website's cartoon avatars, hero and illustration art (`public/images/*`) reused for onboarding and empty states |
| Categories | Big colorful bubbles with emoji (🎨 Crafts, 🎵 Rhymes, 🦁 Animals, 🚀 Science …), one color per category |
| Video feed | Full-screen vertical swipe (like Reelxia/TikTok) with a cartoon-styled action rail |

Two modes share one design: **Watch mode** (Users, light & candy-colored) and **Studio mode**
(Creators, same palette, more dashboard-like).

---

## 2. Screens

### Shared
- **Splash** — animated icon + "Create. Play. Earn."
- **Welcome** — two big cards: "🍿 I want to watch" (User) / "🎬 I'm a creator" (Creator), plus "Just browse" for guests
- **Log in** — a Creator / User switch at the top; email + password
- **Sign up as User** — name, email, password (instant)
- **Sign up as Creator** — the website's application: name, email, password, channel name, @username (live availability check), category, country → "Application submitted" screen
- **Forgot password**

### User (viewer) app — bottom bar: Home · Shorts · Explore · Following · Me
- **Home** — greeting, category bubbles, Trending row, New this week, Top creators
- **Shorts** — vertical swipe feed: autoplay, double-tap ❤️, like / comment / share / report, follow creator
- **Explore** — search + category grid + results
- **Creator channel** — banner, avatar, follow, video grid
- **Following** — videos from followed creators
- **Me** — liked videos, followed creators, watch history (kept on the phone), settings, log out

Guests can watch everything; tapping like / comment / follow opens a friendly "Log in to do this" sheet.

### Creator app — bottom bar: Studio · Videos · ➕ Upload · Earnings · Channel
- **Studio** — earnings cards (total, available, pending, this month), views chart, recent activity
- **Upload** — pick video from phone → title, category, hashtags, originality + copyright checkboxes → progress → result (in review / published / flagged duplicate)
- **My Videos** — status chips (In review, Live, Flagged, Rejected), views/earnings per video, appeal a flag
- **Earnings & Wallet** — earnings breakdown, withdraw (bank / PayPal, $25 min), transaction history
- **Channel** — edit name, description, avatar, social links; notifications; settings; log out
- Creators can still watch the Shorts feed from the Studio header
- **Pending / rejected / suspended** creators see a status screen instead of the studio

---

## 3. Backend changes (Next.js, small and additive)

The website keeps working exactly as it does now.

1. **Phone logins** — `getSessionUser()` in `src/lib/auth.ts` also accepts `Authorization: Bearer <token>` (same Session table). Login and register also return the `token` in JSON; cookies stay for the website.
2. **New "User" account type** — `role: "VIEWER"`, created instantly approved with no channel, via `POST /api/auth/register` with `accountType: "VIEWER"`.
3. **Login as Creator / Login as User** — login accepts `as: "CREATOR" | "VIEWER"` and rejects the wrong type with a clear message; admin accounts are refused in the app.
4. **New account endpoints for any logged-in app user** (`/api/me/...`): my liked videos, my followed creators, update profile, change password, upload avatar. (The existing creator versions reject anyone who isn't a creator.)
5. VIEWERs can like, comment, follow and report, but get 403 on every creator and admin API (already true — `requireCreator()` checks role).
6. **Fix existing bugs that the app would hit** (they affect the website too):
   - "Following" feed always empty — it compares creator *user* ids with *channel* ids (`src/app/api/public/[...path]/route.ts`).
   - The `following` flag on each video is always false — same mix-up.
   - Liking as a guest, then again after logging in on the same phone → server error (unique `[videoId, guestKey]` clash in `social` like).
   - Video list has no paging — add a `cursor` so the Shorts feed can keep scrolling.
7. **Website safety:** the website treats any non-creator as an admin. A User who logs in on the website is sent to the home page instead of the admin console.

---

## 4. App build (Flutter)

New folder: `C:\Claude\My Kuchu Puchu\mobile` · package `com.kuchupuchu.app` · app name "My Kuchu Puchu".

Borrowed from Reelxia (adapted, not copied blindly):
- Architecture: Riverpod + go_router + dio + video_player + flutter_secure_storage, feature-first folders
- `core/network/api_client.dart` — token injection, readable 4xx errors, session-expired → back to login
- `core/storage/session_store.dart` — secure token storage
- `core/playback/player_warmup_cache.dart` — preloads the next video so swipes are instant
- `features/feed/for_you_screen.dart` — swipe feed logic (pause when tab hidden/app backgrounded, preload next)
- `features/feed/widgets/action_rail.dart`, share sheet (share_plus), `features/shell/main_shell.dart` (bottom bar keeping tabs alive)

Not taken from Reelxia: coins, ads, subscriptions, OTT, Firebase, Google sign-in.

Server address: set at build time (`--dart-define=API_BASE_URL=...`), default `http://192.168.1.12:5000`. Switching to the live domain later = one rebuild. Plain HTTP is allowed only for this local build.

---

## 5. Order of work

1. Backend: Bearer tokens, VIEWER role, login-as, User endpoints → test with curl
2. Flutter project, theme, icon, splash, API client, session
3. Welcome, login, sign-up (both types)
4. User app: Home, Shorts feed, Explore, Channel, Following, Me
5. Creator app: Studio, Upload, My Videos, Earnings/Withdraw, Channel/Settings
6. Build APK, install on emulator, walk through both roles, fix issues
7. Hand over `kuchu-puchu.apk` + short install/test guide

## 6. Verification

- curl tests for every changed endpoint (both roles, guest, wrong role, admin refused)
- `flutter analyze` clean
- Run the APK on the Android emulator against the local server: browse as guest; sign up + log in as User (like, comment, follow, liked list); log in as demo creator Meera (studio numbers match website, upload a test video, withdraw form); pending creator Samir sees the review screen
- Confirm the website still logs in and works (cookie path unchanged)

## 7. Notes / later

- **Phone on Wi-Fi:** Windows Firewall may block port 5000 — an inbound rule (needs admin) may be required for a real phone to connect.
- **Signing:** this APK is debug-signed. Before the Play Store, create a My Kuchu Puchu release keystore and back it up (it can never be regenerated).
- **Kids apps on Google Play** must follow the Families policy (no third-party ads/tracking aimed at kids, parental-consent-friendly sign-up). The plan adds no ads or trackers.
