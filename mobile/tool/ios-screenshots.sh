#!/usr/bin/env bash
# App Store screenshots from the real app: runs integration_test/screens_test.dart on a booted
# iPhone Simulator and photographs the Simulator each time the test prints SHOT:<name>.
#   bash mobile/tool/ios-screenshots.sh [simulator id]   -> store/ios/iphone-<name>.png
# Use the largest "Pro Max" Simulator (6.9-inch, 1320x2868). Boot it first:
#   xcrun simctl boot "iPhone 17 Pro Max"
set -euo pipefail
cd "$(dirname "$0")/.."
DEV="${1:-$(xcrun simctl list devices booted | grep -oE '[0-9A-F-]{36}' | head -1)}"
[ -n "$DEV" ] || { echo "No booted Simulator. Boot one first (see the top of this file)."; exit 1; }
OUT="${KP_SHOTS_DIR:-../store/ios}"   # KP_SHOTS_DIR=/tmp/x for a check run that keeps no files
mkdir -p "$OUT"
xcrun simctl status_bar "$DEV" override --time 9:41 --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100
flutter test integration_test/screens_test.dart -d "$DEV" \
  --dart-define=API_BASE_URL=https://mykuchupuchu.com 2>&1 | while IFS= read -r line; do
  echo "$line"
  case "$line" in
    *SHOT:*)
      name="${line##*SHOT:}"; name="${name//[^A-Za-z0-9_-]/}"
      xcrun simctl io "$DEV" screenshot "$OUT/iphone-$name.png" >/dev/null 2>&1 && echo "  saved $OUT/iphone-$name.png"
      ;;
  esac
done
