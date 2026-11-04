# Kuchu Puchu iOS app: build and App Store plan (for Claude on the Mac)

> **Claude on the Mac: this file is your whole brief.** Read all of it before doing anything, follow
> the steps in order, and keep the status log (section 10) up to date. Nothing from the owner's
> Windows PC is needed: the code is on GitHub (public), the app only talks to the public website,
> and every Apple sign-in happens on the Mac.

Written 4 Nov 2026 on the Windows PC.

---

## 0. How to start (for the owner)

1. On the Mac, install **Xcode** from the Mac App Store. It's free and large (about 15 GB), so it can take
   an hour. Open it once:
   - click **Agree**;
   - type your Mac password when it asks;
   - tick **iOS** when it offers platforms to download.
2. Open the Claude app, go to **Code**, pick a folder (your home folder is fine), and send this message:

   > Clone https://github.com/itsashishpandey/kuchu-puchu.git into ~/Projects/kuchu-puchu, then
   > follow docs/ios-app.md in it to build the iOS app and publish it to the App Store.

Claude stops and asks whenever a step needs you; section 3 lists those steps. You don't need to
share any password, server detail or file from the PC. Being on the same Wi-Fi doesn't matter.

---

## 1. Where things stand

- **Kuchu Puchu** is a kids-only (ages 3–8) short-video platform.
  - The website and API are at https://mykuchupuchu.com. It's **production**, with real creators.
  - It's operated by Triple Minds Pvt Ltd; support is support@mykuchupuchu.com.
- **`mobile/` is the Flutter app, and it's watch-only.**
  - It has no accounts, login, creator features, ads, analytics or in-app purchases.
  - It opens straight into a playing Shorts feed. The tabs are Home / Shorts / Explore / Grown-ups.
  - Likes, chosen languages and watch history stay on the device.
  - The Grown-ups tab, Share, Report and every outside link sit behind a **parental gate**: the grown-up types a random
    two-digit number that's shown in words ("forty-seven" → 47). The gate closes after 3 wrong tries.
- **Android:** version 1.5.2 (build 9) is built on the Windows PC with Flutter 3.41.9. The owner publishes it to Google
  Play.
- **iOS:** nothing yet. There's no `mobile/ios` folder; this plan creates it.
- **The server needs no change for iOS** (checked 4 Nov 2026):
  - Views count only when they come from the app. The server accepts any User-Agent that starts with `KuchuPuchuApp/`
    (`isAppUserAgent` in `src/lib/monetization.ts`).
  - Videos are H.264 + AAC MP4 files, and the server answers byte-range requests (HTTP 206), which iPhones need to play
    video.
- **Ready-made assets** are in `mobile/ios-assets/`:
  - `AppIcon-1024.png` is the App Store icon: 1024×1024, square corners, no transparency. Apple rounds the corners
    itself. It's made from `public/brand/icon-full-1024.png`, enlarged 14% so that file's white rounded corners
    are cut off.
  - `LaunchIcon-480.png` is the same artwork with rounded, transparent corners, for the launch screen.

---

## 2. Rules for Claude on the Mac

1. **The GitHub repo is public.** Never commit any of these:
   - the Apple Team ID;
   - an Apple ID email or a phone number;
   - passwords or 2FA codes;
   - certificates, `.p8`, `.p12` or `.mobileprovision` files, or App Store Connect API keys;
   - paths that contain the Mac user name (`/Users/…`).

   Signing settings go in `mobile/ios/Flutter/Signing.xcconfig`, which git ignores (step 4.6). Run the check in
   step 11 before every commit.
2. **Git:**
   - Work on the branch `ios-app` and push only that branch (`git push origin ios-app`).
   - Never push `main`, and never use `--force`, `--all` or `--mirror`.
   - The owner merges `ios-app` into `main` from the Windows PC.
   - Use the same author as the existing commits (`git log -1 --format='%an <%ae>'`).
3. **Don't touch the website or the server.**
   - Don't edit `src/`, `prisma/`, `deploy/` or `public/`, and don't try to deploy.
   - The server login exists only on the Windows PC, on purpose.
   - If the website needs a change, write it in the status log and tell the owner. It's done from the PC.
4. **The live site is production.** The app only reads from it, so testing is safe. But every video you play in the
   Simulator counts as a real view, which can pay a real creator. The cap is 5 counted views per video per
   connection every 4 hours. Play only what a test needs, and never automate playback.
5. **Never type a password or 2FA code, and never accept Apple agreements or terms for the owner.** The owner signs in
   to Xcode, App Store Connect and GitHub, and accepts agreements. Don't create App Store Connect API keys unless the
   owner asks for one.
6. **Ask the owner first, then report what you did:**
   - before creating the app record in App Store Connect (step 7);
   - before entering the App Review contact details (step 9.7);
   - before clicking **Submit for Review** (step 10).
7. Commands that need `sudo` or a password: give the owner the exact command to run in Terminal.
8. Write each finished step in the status log (section 10) and commit the log along with the work.

---

## 3. What only the owner can do

| When | What | Why |
|---|---|---|
| Before starting | Have an **Apple Developer Program** membership (US$99/year, https://developer.apple.com/programs). Claude checks it in step 1. To enroll: as an organisation (Triple Minds Pvt Ltd) the store shows the company as the seller, but it needs a D-U-N-S number and can take days. As an individual it shows your own name. | Apple's rule; it's paid |
| Step 0 | Install Xcode, open it once, agree, add iOS | Needs your Apple ID and Mac password |
| Step 2 | Paste one command in Terminal to install Homebrew, and type your Mac password | Needs your password |
| Step 2 | Xcode → Settings → Accounts → **+** → Apple ID: sign in with the developer account | Needs your Apple ID |
| Step 2 | Approve the GitHub sign-in in the browser (Claude shows a one-time code) | Lets Claude save the iOS project to GitHub |
| Step 7 | Sign in to App Store Connect in Claude's browser pane (Apple ID and 2FA) | Needs your Apple ID |
| Step 7 | Accept any pending agreements, and set your EU trader status (App Store Connect → Business) | Legal declarations are yours |
| Step 9 | Give the App Review contact: name, phone and email | Personal details |
| Step 10 | Say yes to **Submit for Review** | Final go-ahead |
| Optional | Install TestFlight on your iPhone and try the app before it goes public | A real-device check |

---

## 4. Decisions already made

| Item | Value | Notes |
|---|---|---|
| Bundle ID | `kuchupuchu.com` | Same as the Android app ID; the owner chose it on 2 Nov 2026. It's permanent after the first upload. If Apple refuses it, stop and ask the owner (fallback: `com.kuchupuchu.app`). |
| App Store name | **Kuchu Puchu - videos for kids** | 29 of 30 characters, same as Play. If the name is taken, ask the owner. |
| Name under the icon | **Kuchu Puchu** | |
| Subtitle | **Cartoons, rhymes & stories** | 26 of 30 characters |
| Version | **1.5.2**, build **9** | From `mobile/pubspec.yaml` (`version: 1.5.2+9`). Every new upload needs a higher build number (step 12). |
| Devices | **iPhone only** (`TARGETED_DEVICE_FAMILY = 1`), **portrait only** | Supporting iPad would mean every orientation and a landscape layout: Apple is retiring `UIRequiresFullScreen`, the portrait-only option for iPad. iPads still run the iPhone version in a window. iPad support can come in a later version. |
| Server | `--dart-define=API_BASE_URL=https://mykuchupuchu.com` on **every** build, including Simulator runs | Without it the app points at a PC on the owner's network (`http://192.168.1.12:5000`), and iOS asks for Local Network access. |
| Category | Primary **Kids**, age band **5 and Under**; secondary **Entertainment** | Decided earlier in `docs/store-submission.md`. |
| Price | **Free**, no in-app purchases | |
| Countries | **All except China mainland** | China mainland needs a government ICP filing number. |
| Release | **Automatically** after approval | |
| Copyright | **2026 Triple Minds Pvt Ltd** | The operator named in the privacy policy |

---

## 5. Steps

### Step 1: Check the Mac and the Apple account

```bash
sw_vers; uname -m; df -h ~ | tail -1; xcodebuild -version; xcode-select -p
```

- **Xcode version:**
  - It must be **26 or newer**. Since 28 Apr 2026 Apple refuses uploads built with older versions.
  - Xcode 27 needs an Apple-silicon Mac (`arm64`). On an Intel Mac, Xcode 26 works until Apple raises the minimum
    again (expected around April 2027).
- **Disk:** keep about 30 GB free.
- **Developer folder:**
  - `xcode-select -p` must print `/Applications/Xcode.app/Contents/Developer`.
  - If it prints `/Library/Developer/CommandLineTools`, ask the owner to run
    `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- **iOS platform:** if it isn't installed, run `xcodebuild -downloadPlatform iOS`.
- **Membership:** ask the owner to sign in at https://developer.apple.com/account in the browser pane. Then read
  **Membership details**:
  - the program must be the Apple Developer Program, and active;
  - note the **Team ID** (10 characters).

  If there's no paid membership, stop and tell the owner (section 3).

### Step 2: Install the tools

1. **Homebrew.** Ask the owner to paste this in Terminal. It asks for the Mac password, and at the end it prints
   "Next steps" lines (adding `brew` to the PATH), which the owner runs too.
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **CocoaPods and the GitHub CLI** (Claude):
   ```bash
   brew install cocoapods gh
   ```
3. **Flutter** (Claude, no password needed):
   ```bash
   git clone -b stable https://github.com/flutter/flutter.git ~/development/flutter
   echo 'export PATH="$HOME/development/flutter/bin:$PATH"' >> ~/.zprofile
   export PATH="$HOME/development/flutter/bin:$PATH"
   flutter --version && flutter doctor
   ```
   - Use the newest stable release: it supports the newest Xcode best.
   - Run only `flutter pub get`, never `flutter pub upgrade`. `mobile/pubspec.lock` must not change, because the
     Windows PC builds Android from the same file. If it changes, stop and tell the owner.
   - `flutter doctor` must show Xcode ✓. Android can stay ✗.
4. **Xcode account.** Ask the owner to open Xcode → Settings → Accounts → **+** → Apple ID, and sign in with the
   developer account. Then check:
   ```bash
   defaults read com.apple.dt.Xcode IDEProvisioningTeamByIdentifier
   ```
   It should list the team. Use the paid team, not a "Personal Team".
5. **GitHub.** Run:
   ```bash
   gh auth login --hostname github.com --git-protocol https --web
   ```
   Give the owner the one-time code it shows, then run `gh auth setup-git`.
   - The account needs write access to `itsashishpandey/kuchu-puchu`.
   - If the owner skips this step, keep going. The work just stays on the Mac until they sign in.

### Step 3: Get the code

```bash
git clone https://github.com/itsashishpandey/kuchu-puchu.git ~/Projects/kuchu-puchu
cd ~/Projects/kuchu-puchu
git switch ios-app 2>/dev/null || git switch -c ios-app
cd mobile && flutter pub get && flutter analyze && flutter test
```

All tests must pass before you change anything. If `ios-app` already exists on GitHub, read its status log first
and carry on from there.

### Step 4: Add the iOS project

All paths below are inside `mobile/`.

**4.1 Generate it**

```bash
flutter create --platforms=ios --org com.kuchupuchu .
git status --short
```

- Expect only a new `ios/` folder, and possibly a changed `.metadata`.
- If anything in `lib/`, `test/`, `android/` or `pubspec.*` changed, restore it with `git checkout -- <file>`.
- Check the **scene life cycle** is in place. Apps built with the iOS 27 SDK don't start without it, and Flutter 3.41+
  templates include it. Two things to check:
  - `ios/Runner/Info.plist` contains `UIApplicationSceneManifest`;
  - `ios/Runner/AppDelegate.swift` is Flutter's unmodified template.

**4.2 Bundle ID and iPhone-only**

```bash
PBX=ios/Runner.xcodeproj/project.pbxproj
grep -n "PRODUCT_BUNDLE_IDENTIFIER\|TARGETED_DEVICE_FAMILY\|DEVELOPMENT_TEAM" "$PBX"
sed -i '' -e 's/PRODUCT_BUNDLE_IDENTIFIER = com\.kuchupuchu\.kuchuPuchu\.RunnerTests;/PRODUCT_BUNDLE_IDENTIFIER = kuchupuchu.com.RunnerTests;/' \
          -e 's/PRODUCT_BUNDLE_IDENTIFIER = com\.kuchupuchu\.kuchuPuchu;/PRODUCT_BUNDLE_IDENTIFIER = kuchupuchu.com;/' \
          -e 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/' "$PBX"
grep -n "PRODUCT_BUNDLE_IDENTIFIER\|TARGETED_DEVICE_FAMILY\|DEVELOPMENT_TEAM" "$PBX"
```

Read the first grep and adjust the patterns if the template spells the ID differently. The result must be:

- `kuchupuchu.com` in all three Runner configurations (Debug, Release and Profile);
- `kuchupuchu.com.RunnerTests` for the tests target;
- `TARGETED_DEVICE_FAMILY = 1` everywhere;
- **no** `DEVELOPMENT_TEAM` line.

**4.3 Info.plist**

```bash
P=ios/Runner/Info.plist
/usr/libexec/PlistBuddy -c 'Set :CFBundleDisplayName Kuchu Puchu' "$P"
/usr/libexec/PlistBuddy -c 'Set :CFBundleName Kuchu Puchu' "$P"
/usr/libexec/PlistBuddy -c 'Add :ITSAppUsesNonExemptEncryption bool false' "$P"
/usr/libexec/PlistBuddy -c 'Delete :UISupportedInterfaceOrientations' "$P"
/usr/libexec/PlistBuddy -c 'Add :UISupportedInterfaceOrientations array' "$P"
/usr/libexec/PlistBuddy -c 'Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait' "$P"
plutil -lint "$P"
```

- `ITSAppUsesNonExemptEncryption = NO`: the app only uses standard HTTPS, so App Store Connect stops asking about
  export compliance on every upload.
- Add **no** permission keys (`NS…UsageDescription`). The app uses no camera, photos, microphone, location or
  tracking.
- Add **no** `NSAppTransportSecurity` exceptions, because the live site is HTTPS.
- `UISupportedInterfaceOrientations~ipad` can stay; an iPhone-only app ignores it.

**4.4 App icon** (one 1024×1024 image; Xcode makes every other size from it)

```bash
I=ios/Runner/Assets.xcassets/AppIcon.appiconset
find "$I" -type f -delete
cp ios-assets/AppIcon-1024.png "$I/"
cat > "$I/Contents.json" <<'JSON'
{
  "images" : [
    { "filename" : "AppIcon-1024.png", "idiom" : "universal", "platform" : "ios", "size" : "1024x1024" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
JSON
```

**4.5 Launch screen** (match Android: bright cyan with the icon in the middle)

```bash
L=ios/Runner/Assets.xcassets/LaunchImage.imageset
sips -z 160 160 ios-assets/LaunchIcon-480.png --out "$L/LaunchImage.png"
sips -z 320 320 ios-assets/LaunchIcon-480.png --out "$L/LaunchImage@2x.png"
cp ios-assets/LaunchIcon-480.png "$L/LaunchImage@3x.png"
```

Then edit `ios/Runner/Base.lproj/LaunchScreen.storyboard`:

- Change the main view's `<color key="backgroundColor" …/>` from white to `#1AE6FC`:
  `red="0.102" green="0.902" blue="0.988" alpha="1" colorSpace="custom" customColorSpace="sRGB"`.
- The image view should stay centred (`contentMode="center"`).

**4.6 Signing settings, kept out of git**

```bash
TEAM=XXXXXXXXXX   # the Team ID from step 1, never committed
grep -q 'Signing.xcconfig' ios/.gitignore || printf '\n# Apple team ID: stays on this Mac, never in the public repo\nFlutter/Signing.xcconfig\n' >> ios/.gitignore
printf 'DEVELOPMENT_TEAM = %s\nCODE_SIGN_STYLE = Automatic\n' "$TEAM" > ios/Flutter/Signing.xcconfig
for f in Debug Release; do grep -q 'Signing.xcconfig' "ios/Flutter/$f.xcconfig" || echo '#include? "Signing.xcconfig"' >> "ios/Flutter/$f.xcconfig"; done
git check-ignore -v ios/Flutter/Signing.xcconfig   # must print the ignore rule
```

- The Profile configuration uses `Release.xcconfig`, so these two files cover all three configurations.
- Don't set the team in Xcode's Signing & Capabilities tab. That writes `DEVELOPMENT_TEAM` into
  `project.pbxproj`, which is committed.

**4.7 Privacy manifest (recommended)**

Create `ios/Runner/PrivacyInfo.xcprivacy`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataTypeProductInteraction</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><false/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataTypeDeviceID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key><false/>
      <key>NSPrivacyCollectedDataTypeTracking</key><false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key><array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
```

**Add it to the Runner target.** Two ways:

- In Xcode: open `ios/Runner.xcworkspace`, drag the file into the Runner group and tick the "Runner" target.
- In `project.pbxproj`: add a PBXFileReference and a PBXBuildFile for it, list it in the Runner group's children, and
  add it to the Runner target's Resources build phase.

After building, check that `Runner.app/PrivacyInfo.xcprivacy` exists. If you can't add it cleanly, skip it and say so
in the status log. The Flutter plugins ship their own manifests, and the store page's privacy section comes from the
form in step 9.3.

**4.8 Tell the server it's the iOS app**

`lib/core/api.dart` currently sends `(Android)` on every platform. Change the header to:

```dart
import 'dart:io' show Platform;
// …
headers: {'User-Agent': 'KuchuPuchuApp/${AppConfig.version} (${Platform.isIOS ? 'iOS' : 'Android'})'},
```

Android keeps sending exactly the same text, and the server counts both. Then run `flutter analyze && flutter test`.

**4.9 Prepare the Xcode project**

```bash
flutter build ios --config-only --release --dart-define=API_BASE_URL=https://mykuchupuchu.com
[ -f ios/Podfile ] && [ ! -d ios/Pods ] && (cd ios && pod install)
```

Commit here: run the step 11 check, then commit with a message like "Add the iOS project".

### Step 5: Test in the Simulator

```bash
xcrun simctl list devices available | grep -E "iPhone|iPad"
open -a Simulator
flutter run -d <id of the largest iPhone "Pro Max"> --dart-define=API_BASE_URL=https://mykuchupuchu.com
```

This runs a debug build; the Simulator can't run release builds. The debug banner is already off in `main.dart`.
Check each item below and write the results in the status log.

1. **Launch and feed:**
   - The launch screen is cyan with the icon, then the Shorts feed opens.
   - The video plays with sound, and swiping up and down works.
   - Nothing is hidden under the Dynamic Island or the home bar.
2. **Home:** the rails load. Tapping a video in a rail or in "Continue watching" opens the full-screen player, and the
   video fills the screen. (In Android 1.5.1 the header squeezed the video into a thin strip.)
3. **Explore and back:**
   - Categories and search work, and a channel page opens.
   - Swiping from the left edge goes back on every pushed page (iOS has no back button).
4. **Grown-ups:**
   - The tab asks the parental gate. A wrong answer keeps it locked; the right one opens it.
   - Changing languages works, and so does Clear watch history.
5. **Gate on outside actions:** Share, Report ("Something's not right") and the privacy, terms and contact links each
   ask the gate first.
   - Links open Safari.
   - Email may not open in the Simulator; the app then shows a message, which is fine.
6. **Hide a creator:** "We won't show @… here" hides the creator, and Undo brings them back.
7. **Background:** go to the home screen and back. The video pauses while the app is away.
8. **Permissions:** no permission pop-up appears at any point.
9. **iPad:** run on an iPad simulator, where it opens as an iPhone app. It must work and look acceptable; App Review
   sometimes tests iPhone apps on an iPad.
10. **Small screen:** on the smallest iPhone simulator available, nothing is cut off.

Fix problems only when they're specific to iOS, keep Android's behaviour the same, and run `flutter test` again.

### Step 6: Build script and first signed build

Save this as `mobile/tool/build-ios.sh`:

```bash
#!/usr/bin/env bash
# Build the iOS app for the App Store, pointed at the live server.
#   bash mobile/tool/build-ios.sh            -> signed .ipa in mobile/build/ios/export/
#   bash mobile/tool/build-ios.sh --upload   -> the same build, sent to App Store Connect
# Needs Xcode signed in to the Apple developer account, and mobile/ios/Flutter/Signing.xcconfig
# (git-ignored) with DEVELOPMENT_TEAM = <team ID>. Raise `version:` in pubspec.yaml before every upload.
set -euo pipefail
cd "$(dirname "$0")/.."
SIGN=ios/Flutter/Signing.xcconfig
TEAM=$(sed -n 's/^DEVELOPMENT_TEAM *= *//p' "$SIGN" 2>/dev/null | tr -d ' \r')
[ -n "$TEAM" ] || { echo "Missing $SIGN with DEVELOPMENT_TEAM = <team ID> (docs/ios-app.md, step 4.6)"; exit 1; }
DEST=export; [ "${1:-}" = "--upload" ] && DEST=upload

flutter build ios --config-only --release --dart-define=API_BASE_URL=https://mykuchupuchu.com
if [ -f ios/Podfile ] && [ ! -d ios/Pods ]; then (cd ios && pod install); fi

ARCHIVE=build/ios/KuchuPuchu.xcarchive
rm -rf "$ARCHIVE" build/ios/export
xcodebuild -quiet -workspace ios/Runner.xcworkspace -scheme Runner -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" -allowProvisioningUpdates archive

cat > build/ios/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>$DEST</string>
  <key>teamID</key><string>$TEAM</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
PLIST
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist build/ios/ExportOptions.plist \
  -exportPath build/ios/export -allowProvisioningUpdates
VERSION=$(sed -n 's/^version: //p' pubspec.yaml | tr -d '\r')
if [ "$DEST" = upload ]; then echo "✔ iOS $VERSION uploaded to App Store Connect"; else echo "✔ iOS $VERSION: $(ls build/ios/export/*.ipa)"; fi
```

Run `bash tool/build-ios.sh` (local build only). The first run also does two things in the Apple account:

- creates the distribution certificate;
- registers the bundle ID `kuchupuchu.com`.

Then check the result:

```bash
A=build/ios/KuchuPuchu.xcarchive/Products/Applications/Runner.app
plutil -p "$A/Info.plist" | grep -E 'CFBundleIdentifier|CFBundleShortVersionString|CFBundleVersion|DTSDKName|DTXcode|ITSAppUsesNonExemptEncryption|UIDeviceFamily'
grep -c "192.168.1.12" "$A/Frameworks/App.framework/App"   # must print 0: the live server is built in
```

You should see:

- `kuchupuchu.com`;
- version `1.5.2`, build `9`;
- an iOS 26 or newer SDK;
- `UIDeviceFamily` showing only `1`.

### Step 7: Create the app in App Store Connect (ask first)

1. Ask the owner to sign in at https://appstoreconnect.apple.com in the browser pane.
2. Check **Business → Agreements**. If anything is pending, the owner accepts it.
3. Ask the owner about the **EU trader status**. They decide; without it the app can't be sold in the EU.
4. Ask: "May I create the Kuchu Puchu app record in App Store Connect now?"
5. On a yes, go to **Apps → + → New App**:

| Field | Value |
|---|---|
| Platforms | iOS |
| Name | Kuchu Puchu - videos for kids |
| Primary language | English (U.S.) |
| Bundle ID | `kuchupuchu.com` (it appears after step 6) |
| SKU | `kuchupuchu-ios` |
| User access | Full access |

### Step 8: Upload and TestFlight

1. **Upload.** Run `bash tool/build-ios.sh --upload`, and wait for "Upload succeeded".
2. **Processing.** It takes 5–30 minutes. If something is wrong, Apple emails an ITMS-… message. Fix it and upload
   again with a higher build number (step 12).
3. **TestFlight.** Go to TestFlight → Internal Testing → **+**, create a group called "Owner", add the owner's Apple
   ID, and turn on the build.
4. **Tell the owner:** install **TestFlight** on an iPhone and open the invite. This is optional but worth doing:
   it's the only test on a real phone.

### Step 9: Fill in the App Store listing

**9.1 App Information**

| Field | Value |
|---|---|
| Subtitle | Cartoons, rhymes & stories |
| Category | Primary: **Kids**, age band **5 and Under**. Secondary: **Entertainment**. |
| Content rights | Yes, the app shows third-party content (creators' videos), and yes, you have the rights: creators grant a licence when they upload (see https://mykuchupuchu.com/terms). |
| Age rating | Answer the questionnaire with the facts in section 8. |

**9.2 Pricing and Availability**

- Price: **Free**.
- Availability: all countries and regions **except China mainland**.

**9.3 App Privacy**

- Privacy Policy URL: `https://mykuchupuchu.com/privacy`
- Do you collect data? **Yes.** Declare these two types:

| Data type | Purpose | Linked to the person? | Used for tracking? |
|---|---|---|---|
| Usage Data → **Product Interaction** | App Functionality only | **No** | **No** |
| Identifiers → **Device ID** | App Functionality only (counting each view once, blocking fake views) | **No** | **No** |

Everything else is **not collected**: contact info, location, contacts, photos, user content, browsing or search
history, purchases, diagnostics and the rest.

**9.4 Version 1.5.2 page**

Fill in:

- the screenshots (9.5) and the listing text (9.6);
- Support URL: `https://mykuchupuchu.com/#/contact`
- Marketing URL: `https://mykuchupuchu.com`
- Copyright: `2026 Triple Minds Pvt Ltd`
- Build: the processed one;
- Version release: **Automatically release this version**.

**9.5 Screenshots** (iPhone 6.9-inch: 1320×2868, 1290×2796 or 1260×2736)

```bash
xcrun simctl status_bar booted override --time 9:41 --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100
mkdir -p ../store/ios
xcrun simctl io booted screenshot ../store/ios/iphone-1.png     # repeat for each screen
sips -g pixelWidth -g pixelHeight ../store/ios/*.png
```

- **What to capture:** take 5–8 shots on the largest "Pro Max" simulator:
  - the Shorts feed playing a colourful video;
  - Home with its rails;
  - Explore's categories;
  - a category list;
  - a channel page;
  - the language picker;
  - the Grown-ups area.
- **Kids content only:** no "earn" or money wording, and no creator dashboard. Pick bright, clearly
  kid-friendly videos.
- **Uploading:** if the browser pane can't upload files, open Finder at `store/ios` and ask the owner to drag the
  files in.

**9.6 Listing text**

*Promotional text* (up to 170 characters):

> Short, happy cartoons, rhymes and stories made for children aged 3–8. Every video is checked by a person first. No ads, no chat, no sign-up.

*Description:*

> Kuchu Puchu is a safe, simple place for children aged 3 to 8 to watch short cartoons, rhymes, stories and early-learning videos.
>
> OPENS STRAIGHT INTO FUN
> Kuchu Puchu starts playing right away. Swipe up for the next video, or browse Home and Explore for nursery rhymes, alphabet and phonics, numbers, colours and shapes, funny cartoons, good manners and more.
>
> MADE FOR YOUNG CHILDREN
> • Every video is made for children aged 3–8 and checked by a person on our team before it appears
> • No ads and no in-app purchases
> • No chat, no comments and no sign-up: children can't post or message anyone
> • Videos in Hindi, Punjabi, Haryanvi, English and more, and grown-ups choose the languages
>
> FOR GROWN-UPS
> • A grown-ups area behind a parental gate: choose languages, clear watch history, read our privacy policy and contact us
> • Sharing, reporting a video and links to our website also ask a grown-up first
> • Don't want to see a creator? Hide them with one tap
> • Likes and watch history stay on this device. The app asks for no names, emails, photos or location
>
> Questions or feedback: support@mykuchupuchu.com

*Keywords* (96 of 100 characters):

```
cartoons,rhymes,animation,stories,preschool,toddler,nursery,learning,hindi,punjabi,shorts,family
```

The description's languages and topics match the live videos on 4 Nov 2026. If the catalogue has changed a lot,
update them, and never claim something the app doesn't have.

**9.7 App Review Information** (ask first)

- Sign-in required: **No**.
- Contact (first and last name, phone, email): **ask the owner**.
- Notes:

> Kuchu Puchu is a watch-only app for children aged 3–8. There is no sign-in and no account; the app opens straight into a playing video feed.
> Parental gate: the Grown-ups tab, outside links, Share and Report ask a grown-up to type a number written in words as digits (for example "forty-two" → 42).
> Videos come from creators approved on our website (https://mykuchupuchu.com), and our team reviews each video before it appears. Children can't post, comment or message. A grown-up can report a video (behind the gate), and any viewer can hide a creator.
> No ads, no purchases, and no analytics or other third-party SDKs that collect data.

### Step 10: Submit for review (ask first)

1. Check that App Store Connect shows no missing fields.
2. Ask the owner: "Everything is filled in. May I click Submit for Review?"
3. On a yes, click **Add for Review → Submit**. The status becomes "Waiting for Review". Review usually takes 1–3
   days, sometimes longer for kids apps.
4. **If Apple rejects it:**
   - read the message in App Store Connect (App Review / Resolution Center);
   - write it in the status log and tell the owner;
   - fix it, raise the build number (step 12), upload, reply to Apple and resubmit, asking the owner first again.

### Step 11: Save the work to GitHub

Run these checks before **every** commit (from `~/Projects/kuchu-puchu`):

```bash
git add -A mobile store docs/ios-app.md
git status --short
TEAM=$(sed -n 's/^DEVELOPMENT_TEAM *= *//p' mobile/ios/Flutter/Signing.xcconfig | tr -d ' \r')
git diff --cached | grep -nE "/Users/|DEVELOPMENT_TEAM *=|PRIVATE KEY|\.p8|\.p12|mobileprovision|@icloud\.com|@me\.com" && echo "STOP: private data staged"
[ -n "$TEAM" ] && git diff --cached | grep -c "$TEAM"     # must print 0
git check-ignore -q mobile/ios/Flutter/Signing.xcconfig && echo "signing file is ignored"
```

- If anything private shows up, unstage it, fix it, and check again.
- Then commit, and push only the branch: `git push -u origin ios-app`.
- Tell the owner: "On the Windows PC, ask Claude to merge `ios-app` into `main`."

### Step 12: Later updates

1. **Version.** Raise `version:` in `mobile/pubspec.yaml`, and `version`/`build` in `mobile/lib/core/config.dart`
   to match (a test checks they agree).
   - The build number (`+N`) must be higher than anything uploaded before.
   - Keep one sequence for both stores, so Android and iOS never reuse a number.
2. **Build and upload.** Run `bash tool/build-ios.sh --upload`.
3. **New version in App Store Connect.** Click **+ Version**, write "What's New", pick the build, and submit (ask
   first).
4. **After the first approval:**
   - put the App Store link in the status log;
   - the owner adds an App Store badge to the website from the Windows PC (website deploys happen only there).

---

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| "No Accounts" or "No signing certificate … found" | The Xcode account isn't signed in (step 2.4). |
| "Your team has no devices from which to generate a provisioning profile" | Option 1: ask the owner to plug in an iPhone once and tap Trust; Xcode registers it. Option 2: add `CODE_SIGN_IDENTITY="Apple Distribution"` to the `xcodebuild … archive` line. |
| "No suitable application records were found" | Create the app record first (step 7). |
| "The bundle version must be higher than the previously uploaded version" | Raise `+N` in `pubspec.yaml` and `build` in `config.dart` (step 12). |
| "Invalid Bundle … iPad Multitasking … orientations" | `TARGETED_DEVICE_FAMILY` isn't `1` in every configuration (step 4.2). |
| Email ITMS-90683 "Missing purpose string" | A plugin links a protected API. Find which one, then tell the owner before adding a usage string or changing plugins. |
| Email ITMS-91053 / 91061 (privacy manifest) | Add or repair `PrivacyInfo.xcprivacy` (step 4.7). Plugin updates change `pubspec.lock`, so ask the owner first. |
| Black screen or "UIScene life cycle is required" at launch | Check `UIApplicationSceneManifest` (step 4.1). Make sure Flutter is the newest stable release, then run `flutter create --platforms=ios .` again to restore missing template files. |
| CocoaPods errors | `cd ios && pod repo update && pod install`; if that's not enough, `flutter clean` and build again. |
| A video doesn't play | Open its URL in Safari on the Mac. The videos are H.264/AAC with range support (checked), so it's usually the network. |
| Rejected under 1.3 (Kids) | Usually a link or action that isn't gated. Find it, put it behind `ParentalGate.check`, and test again. |
| Rejected under 4.2 (not enough content) | Tell the owner. More approved videos on the website fixes it; there were 26 on 4 Nov 2026. |

---

## 7. Where things live after this plan

| Path | What |
|---|---|
| `mobile/ios/` | The Xcode project (committed) |
| `mobile/ios/Flutter/Signing.xcconfig` | The Team ID: **on the Mac only**, git-ignored |
| `mobile/tool/build-ios.sh` | Build or upload script |
| `mobile/ios-assets/` | Icon sources for iOS |
| `store/ios/` | App Store screenshots |
| `mobile/build/ios/` | Build output (git-ignored) |

---

## 8. Facts for any question in Apple's forms

Answer from these facts. If a question doesn't fit them, say so in the status log and ask the owner; don't guess.

- **Audience:** children aged 3–8. Grown-ups choose the languages.
- **Content:**
  - short videos from creators who applied on the website and were approved;
  - **a person reviews every video before it's public**;
  - creators keep ownership and grant Kuchu Puchu a licence to show their videos.
- **What viewers can do:** nothing that sends anything a child types. They can't post, comment, chat, message, upload
  or follow anyone, and comments are off.
- **Not in the app:**
  - accounts or sign-in;
  - purchases;
  - ads, ad SDKs or analytics SDKs;
  - tracking (no IDFA, no App Tracking Transparency prompt);
  - in-app web browser (links open Safari after the gate);
  - location;
  - permission requests.
- **Data sent to our server:**
  - which videos are watched and for how long, plus shares and reports (a report is a preset reason, never typed text);
  - an anonymous viewer key, computed on the server from the connection and the app version and never linked to a
    person;
  - nothing else: no names, emails or location (not even the country).
- **Grown-up controls:** a Grown-ups area behind the parental gate (languages, clear history, legal pages, contact).
  Share, Report and every outside link ask the gate each time.
- **Safety tools:** human review before publishing, in-app reporting, hiding a creator, and the contact email.
- **Age-rating topics:** no violence, horror, sexual content, bad language, drugs, alcohol, tobacco, gambling,
  contests, medical content, loot boxes or unrestricted web access.
- **Encryption:** standard HTTPS only, which is exempt (`ITSAppUsesNonExemptEncryption = NO`).
- **Legal:**
  - operator: Triple Minds Pvt Ltd;
  - privacy policy: https://mykuchupuchu.com/privacy (COPPA, GDPR-K, India's DPDP);
  - terms: https://mykuchupuchu.com/terms;
  - support: support@mykuchupuchu.com.
- **Google Play:** the Android app is in Play's Families programme (ages 5 & under and 6–8), and its Data safety
  answers match section 9.3.

---

## 9. After the owner merges `ios-app` (Windows PC)

- Merge `ios-app` into `main` and push `main`.
- Update the comment above `isAppUserAgent` in `src/lib/monetization.ts`: the app now says `(iOS)` or `(Android)`.
- Once the app is live, add an App Store badge and link to the website, then deploy.

---

## 10. Status log

Claude on the Mac: add a row after each step, newest at the bottom, and commit it with the work.

| Date | Step | Result |
|---|---|---|
| 2026-11-04 | Plan written on the Windows PC | Icons ready in `mobile/ios-assets/`. Server checked: no change needed. Nothing built for iOS yet. |
