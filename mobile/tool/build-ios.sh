#!/usr/bin/env bash
# Build the iOS app for the App Store, pointed at the live server.
#   bash mobile/tool/build-ios.sh            -> signed .ipa in mobile/build/ios/export/
#   bash mobile/tool/build-ios.sh --upload   -> the same build, sent to App Store Connect
# Needs, on the Mac and outside git: ios/Flutter/Signing.xcconfig (written by `fastlane signing`
# in mobile/ios) and ~/.kuchupuchu/asc.json (the team's App Store Connect API key) for uploads.
# Raise `version:` in pubspec.yaml (and config.dart) before every upload: the +N build number must grow.
set -euo pipefail
cd "$(dirname "$0")/.."
SIGN=ios/Flutter/Signing.xcconfig
val() { sed -n "s/^$1 *= *//p" "$SIGN" 2>/dev/null | tr -d '\r' | head -1; }
TEAM=$(val DEVELOPMENT_TEAM)
PROFILE=$(val KP_PROFILE_NAME)
if [ -z "$TEAM" ] || [ -z "$PROFILE" ]; then
  echo "Run 'fastlane signing' in mobile/ios first (docs/ios-app.md, step 6)."; exit 1
fi
DEST=export
AUTH=()
if [ "${1:-}" = "--upload" ]; then
  ASC="$HOME/.kuchupuchu/asc.json"
  [ -f "$ASC" ] || { echo "Missing $ASC (docs/ios-app.md, step 6)."; exit 1; }
  j() { plutil -extract "$1" raw -o - "$ASC"; }
  AUTH=(-authenticationKeyPath "$(j key_path)" -authenticationKeyID "$(j key_id)" -authenticationKeyIssuerID "$(j issuer_id)")
  DEST=upload
fi

flutter build ios --config-only --release --dart-define=API_BASE_URL=https://mykuchupuchu.com
ARCHIVE=build/ios/KuchuPuchu.xcarchive
rm -rf "$ARCHIVE" build/ios/export
xcodebuild -quiet -workspace ios/Runner.xcworkspace -scheme Runner -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" archive

cat > build/ios/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>$DEST</string>
  <key>teamID</key><string>$TEAM</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>Apple Distribution</string>
  <key>provisioningProfiles</key>
  <dict><key>kuchupuchu.com</key><string>$PROFILE</string></dict>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
PLIST
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist build/ios/ExportOptions.plist \
  -exportPath build/ios/export ${AUTH[@]+"${AUTH[@]}"}
VERSION=$(sed -n 's/^version: //p' pubspec.yaml | tr -d '\r')
if [ "$DEST" = upload ]; then echo "✔ iOS $VERSION uploaded to App Store Connect"; else echo "✔ iOS $VERSION: $(ls build/ios/export/*.ipa)"; fi
