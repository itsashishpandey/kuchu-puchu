#!/usr/bin/env bash
# Redeploy the Kuchu Puchu website + API to the production server (https://mykuchupuchu.com).
# Run from the repo root in Git Bash:   bash deploy/redeploy.sh
#
# What it does: packs the source → uploads → builds on the server (Node 22) → backs up the
# live database → swaps the runtime folder (previous one kept as mykuchupuchu-app.prev) →
# restarts PM2 "mykuchupuchu" → health check, automatic rollback if the new build is unhealthy.
# Never touched: ~/mykuchupuchu-data (database, uploads, APK downloads).
#
# Database: after the backup, versioned migrations (prisma/migrations) are applied and the
# idempotent discovery seed/backfill runs (prisma/migrate-deploy.mjs). A failed migration restores
# the backup automatically. Migrations are additive, so a rollback of the app keeps working.
set -euo pipefail
cd "$(dirname "$0")/.."
# The server login stays out of git: deploy/.deploy.env (ignored) holds KP_DEPLOY_HOST=user@server
[ -f deploy/.deploy.env ] && . deploy/.deploy.env
HOST="${KP_DEPLOY_HOST:?Set KP_DEPLOY_HOST=user@server in deploy/.deploy.env (not committed)}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "▶ packing source"
# public/videos (~35 MB of sample clips that never change) is not uploaded every time: the server copies it
# from the running site. Set FULL_MEDIA=1 to upload it anyway (first deploy on a new server, or new clips).
MEDIA_EXCLUDE=(--exclude='public/videos')
[ "${FULL_MEDIA:-0}" = "1" ] && MEDIA_EXCLUDE=()
tar --exclude='public/uploads' "${MEDIA_EXCLUDE[@]}" -czf "$TMP/src.tgz" \
  src public prisma package.json package-lock.json next.config.ts tsconfig.json \
  postcss.config.mjs tailwind.config.ts components.json eslint.config.mjs
echo "▶ uploading ($(du -h "$TMP/src.tgz" | cut -f1))"
scp -o BatchMode=yes -q "$TMP/src.tgz" "$HOST:mykuchupuchu-src.tgz"

echo "▶ building + swapping on the server"
ssh -o BatchMode=yes "$HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
export PATH=$HOME/.nvm/versions/node/v22.23.2/bin:$PATH
SRC=$HOME/mykuchupuchu-src APP=$HOME/mykuchupuchu-app DATA=$HOME/mykuchupuchu-data
cd "$SRC"
# fresh sources, keep node_modules (faster installs) and .env
find "$SRC" -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .env -exec rm -rf {} +
tar -xzf $HOME/mykuchupuchu-src.tgz && rm $HOME/mykuchupuchu-src.tgz
if [ ! -d "$SRC/public/videos" ]; then
  if [ -d "$APP/public/videos" ]; then cp -a "$APP/public/videos" "$SRC/public/videos"
  else echo "✖ public/videos is missing on the server — re-run with FULL_MEDIA=1"; exit 1; fi
fi
npm install --no-audit --no-fund > $HOME/logs/mykuchupuchu-npm.log 2>&1
npx prisma generate > /dev/null
NEXT_TELEMETRY_DISABLED=1 npx next build > $HOME/logs/mykuchupuchu-build.log 2>&1 \
  || { echo "BUILD FAILED — live site untouched"; tail -30 $HOME/logs/mykuchupuchu-build.log; exit 1; }

BACKUP="$DATA/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).db"
cp "$DATA/mykuchupuchu.db" "$BACKUP"
# migrations + discovery seed (DATABASE_URL comes from $SRC/.env, the live database)
if ! node prisma/migrate-deploy.mjs > $HOME/logs/mykuchupuchu-migrate.log 2>&1; then
  echo "✖ database migration failed — restoring $BACKUP"
  tail -30 $HOME/logs/mykuchupuchu-migrate.log
  pm2 stop mykuchupuchu > /dev/null
  cp "$BACKUP" "$DATA/mykuchupuchu.db" && rm -f "$DATA/mykuchupuchu.db-journal"
  pm2 start mykuchupuchu > /dev/null
  exit 1
fi
echo "✔ database migrated ($(grep -c '' $HOME/logs/mykuchupuchu-migrate.log) log lines)"
rm -rf "$APP.prev" && mv "$APP" "$APP.prev"
mkdir -p "$APP/.next"
cp -a "$SRC/.next/standalone/." "$APP/"
cp -a "$SRC/.next/static" "$APP/.next/static"
cp -a "$SRC/public" "$APP/public"
rm -rf "$APP/public/uploads" && ln -s "$DATA/uploads" "$APP/public/uploads"
cp "$APP.prev/rehash-fingerprints.cjs" "$APP/" 2>/dev/null || true
pm2 restart mykuchupuchu --update-env > /dev/null
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  if curl -sf -o /dev/null http://127.0.0.1:4050/api/public/stats; then echo "✔ healthy — deployed"; exit 0; fi
done
echo "✖ new build unhealthy — rolling back"
rm -rf "$APP" && mv "$APP.prev" "$APP" && pm2 restart mykuchupuchu > /dev/null
exit 1
REMOTE

echo "▶ public check"
echo "https://mykuchupuchu.com -> HTTP $(curl -s -o /dev/null -w '%{http_code}' https://mykuchupuchu.com/)"
