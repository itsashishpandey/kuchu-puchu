#!/usr/bin/env bash
# Build the Google Play App Bundle: signed with the upload key (android/key.properties),
# pointed at the live server. Run from anywhere in Git Bash:
#   bash mobile/tool/build-play.sh
# Bump `version:` in pubspec.yaml before every new Play upload (the +N build number must grow).
set -euo pipefail
cd "$(dirname "$0")/.."
test -f android/key.properties || { echo "android/key.properties is missing (see docs/store-submission.md)"; exit 1; }
export PATH="/c/tools/flutter/bin:$PATH"
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://mykuchupuchu.com
AAB=build/app/outputs/bundle/release/app-release.aab
VERSION=$(sed -n 's/^version: //p' pubspec.yaml | tr -d '\r')
OUT="build/my-kuchu-puchu-${VERSION/+/-build}-play.aab"
cp "$AAB" "$OUT"
echo "✔ $OUT ($(du -h "$OUT" | cut -f1))"
