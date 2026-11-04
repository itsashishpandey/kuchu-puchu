# Store submission checklist: My Kuchu Puchu (kids, ages 3–8)

The app and website were converted to kids-only on 2 Nov 2026 (see "Kids-only platform" in
`docs/discovery.md`). This is what's left to do, and what to answer in the store forms.

Approval is never guaranteed: reviewers decide. The answers below match what the app actually does, and
that matters most.

## 1. Before the first upload (blockers)

| # | Item | Status |
|---|------|--------|
| 1 | **Release signing.** An upload keystore was created on 2 Nov 2026. See "Signing key" below. **Back up `keys/mykuchupuchu-upload-keystore.jks` and its password somewhere offline** (USB drive, password manager): without it you can't publish updates. | Done, but back it up |
| 2 | **App Bundle for Play:** run `bash mobile/tool/build-play.sh`. It is signed with the upload key and points at the live server. From 1.5.0 (build 7) the app is watch-only: no login, no sign-up, no creator features. Use the newest bundle in `mobile/build/` (`my-kuchu-puchu-<version>-play.aab`). | Done |
| 3 | **Real content.** All demo data was removed from the live site on 2 Nov 2026, so the app shows "No videos right now" until real creators upload and you approve their videos (Admin → Videos). Wait until there are enough approved videos, then retake the 8 store screenshots so they match what reviewers will see. | To do |
| 4 | **App access.** Choose "All functionality is available without special access". The app has no login. You can add a note for reviewers: "Grown-up settings and outside links are behind a parental gate: type the number shown in words as digits." | To do |
| 5 | Play developer account (one-time US$25). Apple Developer Program (US$99/year) for iOS. | Yours |

Already done in app 1.5.0 and on the server:
- the app opens straight into a playing video;
- no accounts in the app: no login, no sign-up, no personal data;
- no creator features in the app (creators apply and upload on the website only);
- no ads, no ad/analytics SDKs, `AD_ID` permission removed;
- targetSdk 36;
- a parental gate before the grown-ups' settings, outside links, share and report;
- comments off;
- every video is human-reviewed before it's public;
- in-app reporting;
- a COPPA-style privacy policy.
- fonts are bundled in the app, which never contacts Google or any other third party (checked: no Firebase, Play services, ads or analytics code);
- views store no country or other location (migration 0007 cleared old values);
- 16 KB page-size support, 64-bit, targetSdk 36 (checked on the 1.5.0 bundle).

### Signing key

- **Keystore:** `mobile/android/upload-keystore.jks` (PKCS12, RSA 4096, alias `upload`, valid 10,000 days).
  Backup: kept with your private files (not in this repo).
- **Password:** your private credentials file (not in this repo) (the store and key passwords are the
  same). It's also in `mobile/android/key.properties`, which Gradle reads. Both the keystore and
  `key.properties` are gitignored (`mobile/android/.gitignore`).
- **SHA-256:** `E7:31:A9:D3:7B:0F:3A:05:30:0B:06:7C:86:45:28:32:A2:CA:98:73:92:DC:BB:2E:2B:E9:79:EB:E2:BD:DF:83`
- **First upload:** create the app in Play Console (package `kuchupuchu.com` is permanent), choose
  **"Let Google manage and protect your app signing key"**, and upload the .aab. This keystore then acts as
  the *upload key*. If it's ever lost, Google can reset an upload key, but not if you opted out of Play
  App Signing.
- **Every new upload:** raise `version:` in `mobile/pubspec.yaml` (the `+N` build number must grow), then
  run `bash mobile/tool/build-play.sh`.
- **The website APK:** since 2 Nov 2026 it uses the app ID `kuchupuchu.com` and this upload key (build:
  `flutter build apk --release --dart-define=API_BASE_URL=https://mykuchupuchu.com`). The earlier
  `com.kuchupuchu.app` builds are a different app to Android, so the site asks people to uninstall the old
  version first. Copies installed from Play are signed by Google's key, so a phone can't switch between the
  website APK and the Play version without uninstalling.

## 2. Google Play Console answers

| Section | Answer |
|---|---|
| **App name** (store listing) | **Kuchu Puchu - videos for kids** (29 of the 30 characters both stores allow). The name under the icon on the phone stays "My Kuchu Puchu", which is close enough for both stores. |
| **App ID** (package name / bundle ID) | **`kuchupuchu.com`**, chosen by the owner on 2 Nov 2026. It's permanent after the first upload. |
| App category | **Entertainment**, to match "videos for kids" |
| **Target audience and content** | **Ages 5 & under** and **Ages 6–8** only. Nothing older. This puts the app under the **Families policy**. |
| Appeals to children | Yes |
| Ads | **No, my app does not contain ads** |
| Content rating (IARC questionnaire) | No violence, fear, sexual content, bad language, drugs, gambling or purchases. Users can't talk to each other, share content or post anything in the app: no chat, comments, messaging, uploads or location sharing. The videos come from vetted creators and are reviewed before they're published. Expected result: Everyone / PEGI 3 / 3+ |
| Privacy policy URL | `https://mykuchupuchu.com/privacy` |
| Does the app let users create accounts? (Data safety) | **No.** The app has no accounts, so no deletion URL is needed. If Play asks anyway, use `https://mykuchupuchu.com/account-deletion` (website accounts). |
| Data encrypted in transit | Yes (HTTPS only) |
| Data shared with third parties | No (hosting, email and payout providers are service providers, which Play doesn't count as "sharing") |
| Government / financial / health features | None |
| Teacher Approved (optional) | You can opt in once real content is live |

**Data safety: "Data collected" by the app.** Everything is *required*, used for *app functionality* and
*fraud prevention*, collected *automatically*, never shared and never used for advertising:

| Data type | What it is |
|---|---|
| App activity → App interactions | Which videos are watched, how long, likes, shares and reports |
| Device or other IDs | A random viewer key worked out on the server, not linked to a name |

Answer **No** for everything else: personal info, location, photos/videos, audio, files, contacts,
messages, financial info and health. The app collects no personal information. Creator and parent data
is collected on the website only, so it doesn't belong in the app's Data safety form. This matches
`/privacy`.

## 3. Apple App Store

**The full plan is [`docs/ios-app.md`](ios-app.md).** Claude follows it on the Mac: setup, build, upload,
listing text, privacy answers and a status log. The key points:

- **Needs:** a Mac with Xcode 26 or newer, and an Apple Developer Program membership (US$99/year).
- **Kids Category:** Apple lets you pick **one** age band. Pick **5 and Under**: the content rules are written so
  a 3-year-old can watch everything, and most videos are rhymes, stories and early learning. Choose
  6–8 instead if you later add mostly school-age content.
- **Guideline 1.3 / 5.1.4 (Kids):**
  - Grown-ups, share, report and outside links sit behind the parental gate (done);
  - no third-party analytics or ads (done);
  - no purchases in the app (done).
- **Accounts:** the app has none since 1.5.0 (watch-only), so in-app account deletion and Sign in with Apple
  don't apply.
- **App Privacy "nutrition label":** the same answers as the Data safety table above (Product Interaction and
  Device ID, for app functionality only, not linked to a person, no tracking).

## 4. Known review risks and what to do

- **The creator studio lives inside the kids app.** It's behind the parental gate, which both stores accept. If a reviewer still objects:
  - ship the studio as a separate "My Kuchu Puchu Studio" app for adult creators;
  - or keep studio features on the website only.
- **Earnings wording** (₹, $, "earn") only appears in the gated creator area of the app; keep it out of the kids' screens and the store listing screenshots.
- **Store listing:** screenshots, title and description must show only kids content. Don't say "earn money" in the main listing, because it's a kids app. Creator earnings can be explained on the website.
- **Website parental gate:** the website has none (only the store apps need one). The website's sign-up already asks for parent (18+) confirmation.
