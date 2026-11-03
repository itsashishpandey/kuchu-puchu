# My Kuchu Puchu — Android app

Flutter app for **Users** (watch, like, comment, follow) and **Creators** (upload, earnings, withdraw).
Admins use the website only. Plan and design notes: [`../docs/mobile-app-plan.md`](../docs/mobile-app-plan.md).

## Install the APK

The live build (talks to https://mykuchupuchu.com) is downloadable on any Android phone from
**https://mykuchupuchu.com/downloads/my-kuchu-puchu.apk** (allow "install unknown apps").
A copy is at `../my-kuchu-puchu.apk`. Publishing a new build: see `../docs/deploy.md`.

For a local test build against this PC instead, pass the PC's Wi-Fi address (below).

## Demo accounts

The login screen shows one-tap demo buttons (hide them with `--dart-define=SHOW_DEMO=false`).

| Role | Email | Password |
|---|---|---|
| User | user@mykuchupuchu.com | User@1234 |
| Creator (approved) | meera@mykuchupuchu.com | Creator@123 |
| Creator (waiting for approval) | samir@mykuchupuchu.com | Creator@123 |

## Build

```bash
flutter pub get
flutter build apk --release --dart-define=API_BASE_URL=http://192.168.1.12:5000
```

For the live site, pass the domain instead (no `/api` suffix):

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://mykuchupuchu.com --dart-define=SHOW_DEMO=false
```

Plain HTTP is only allowed for local dev hosts (`res/xml/network_security_config.xml`:
192.168.1.12, 10.0.2.2, localhost) — add your PC's address there if it changes.

**Signing:** builds are currently signed with the debug key. Before publishing to Google Play,
create a release keystore, wire it into `android/app/build.gradle.kts`, and back it up —
a lost keystore means no updates can ever be shipped to existing installs.

## Layout

```
lib/
  core/       config (server URL), api client, login session, theme, models, router
  shared/     playful widgets (bouncy buttons, video cards, stickers, empty states)
  features/
    auth/     splash, welcome (Watch / Create), login (User | Creator), sign-up, forgot password
    viewer/   Home, Explore, Following, Me, creator channel, video lists
    feed/     full-screen Shorts feed, comments, report, player
    creator/  Studio, My Videos, Upload, Earnings / Withdraw / Transactions, Channel, review status
    account/  edit profile, change password (both roles)
```

Patterns borrowed from Reelxia (`C:\Claude\Reelxia\reelxia\app`): Riverpod + go_router + dio,
token-injecting API client that reads server error messages, bottom shell that keeps tabs alive,
and the swipe feed that pauses when hidden and preloads the next video.

## Backend endpoints added for the app

- Login/register return a `token`; the app sends `Authorization: Bearer <token>` (website still uses the cookie).
- `POST /api/auth/login` accepts `as: "CREATOR" | "VIEWER"`; admin accounts are refused in the app.
- `POST /api/auth/register` with `accountType=VIEWER` creates an instant User account.
- `/api/me/likes`, `/api/me/following`, `PATCH /api/me/profile`, `PATCH /api/me/password`, `POST /api/me/avatar`.
- `GET /api/public/videos` supports `offset` paging (`nextOffset` in the response).

## Admin side (website) for app activity

- **Reports & Comments** (`#/admin/safety`): videos users report from the app (keep / remove — the creator is notified),
  and every comment (delete). Open reports show as a badge in the admin menu.
- **App Users** (`#/admin/app-users`): User accounts with likes / comments / follows; suspend (signs them out of
  every device), reactivate, delete all their comments.
- Suspended accounts (Users and Creators) lose their session immediately — the app returns them to the welcome screen.
