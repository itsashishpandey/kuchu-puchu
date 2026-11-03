# My Kuchu Puchu — production runbook

Live: **https://mykuchupuchu.com** (website, admin at `/#/admin`, API at `/api`) ·
Android APK: **https://mykuchupuchu.com/downloads/my-kuchu-puchu.apk**

## Where it runs

| Piece | Where |
|---|---|
| Server | A cPanel VPS (Apache, PM2, Node 22). The SSH login (`user@server`) is kept out of git in `deploy/.deploy.env` as `KP_DEPLOY_HOST` |
| App process | PM2 app `mykuchupuchu`, Node 22, `127.0.0.1:4050` (entry in `~/ecosystem.config.js`) |
| Runtime folder | `~/mykuchupuchu-app` (Next.js standalone build; previous build kept as `mykuchupuchu-app.prev`) |
| Build folder | `~/mykuchupuchu-src` (`.env` holds `DATABASE_URL`) |
| **Data (never overwritten by deploys)** | `~/mykuchupuchu-data/` — `mykuchupuchu.db` (SQLite), `uploads/` (creator videos, thumbnails, avatars), `downloads/` (APK), `backups/` |
| Web server | Apache (cPanel addon `mykuchupuchucom`), proxy + aliases in `/etc/apache2/conf.d/userdata/{std,ssl}/2_4/ACCOUNT/mykuchupuchu.com/nodeproxy.conf` |
| TLS | Let's Encrypt via cPanel AutoSSL (auto-renews) |
| DNS | Cloudflare zone `mykuchupuchu.com`: A `@` → SERVER_IP proxied, CNAME `www` proxied |
| Video tools | ffmpeg/ffprobe 6.1 from Ubuntu (`/usr/bin`) — upload checks, fingerprints, thumbnails |
| Logs | `~/logs/mykuchupuchu.{out,err}.log`, build log `mykuchupuchu-build.log` |

Apache serves `/uploads/*` and `/downloads/*` straight from the data folder: Next.js only serves
`public/` files that existed at build time, so runtime uploads must not go through it. The APK
is sent with `Cache-Control: no-store` so phones never get a stale copy from Cloudflare.
A copy of the Apache include is kept in `deploy/apache-nodeproxy.conf`. It proxies everything to
the app **except** cPanel's `/___proxy_*` paths — a plain `ProxyPass "/"` breaks webmail.

## Email

| | |
|---|---|
| Mailbox | **support@mykuchupuchu.com** (10 GB) — password kept in your private credentials file (not in this repo) |
| Forwarders → support@ | creators@, payments@, copyright@mykuchupuchu.com (the addresses shown on the website) |
| Webmail | https://webmail.mykuchupuchu.com (or cPanel → Email Accounts) |
| Phone / Outlook / Gmail app | Username = full address · Incoming IMAP `mail.mykuchupuchu.com` port 993 SSL · Outgoing SMTP `mail.mykuchupuchu.com` port 465 SSL |
| DNS (Cloudflare, DNS-only) | A `mail` + A `webmail` → SERVER_IP · MX 0 `mail.mykuchupuchu.com` · SPF `v=spf1 +a +mx +ip4:SERVER_IP ~all` · DKIM `default._domainkey` · DMARC `p=quarantine` |
| Unknown addresses | rejected ("No Such User Here"), like the other domains on this server |

`mail` and `webmail` must never be proxied (orange cloud) in Cloudflare — mail can't pass through it.
The website does not send real email yet: platform emails are recorded in the admin "mail log" only.

Limits to know: Cloudflare (free plan) rejects request bodies over **100 MB**, so video uploads
above that fail even though the admin upload rule allows 200 MB.

## Redeploy the website / API

```bash
bash deploy/redeploy.sh
```

Builds on the server, backs up the live DB to `backups/pre-deploy-*.db`, swaps the runtime folder,
health-checks, and rolls back automatically if the new build doesn't answer. ~1 minute.

**Database changes are applied automatically** by the script, right after the backup, with
`node prisma/migrate-deploy.mjs`:

1. a database from before versioned migrations gets `0001_baseline` recorded as applied (nothing re-runs);
2. `prisma migrate deploy` applies newer migrations in `prisma/migrations/` (all additive);
3. the discovery seed adds any missing languages / categories / subcategories and tags untagged videos
   (idempotent — running it again changes nothing).

If a migration fails, the script stops the site, restores the backup and exits; the live site is not swapped.
Schema changes must come as a new migration folder (`npx prisma migrate dev --create-only --name <x>`),
never `db push`. Rehearse risky ones on a copy first:
`sqlite3 mykuchupuchu.db ".backup copy.db"`, then `DATABASE_URL=file:copy.db node prisma/migrate-deploy.mjs`.

## Publish a new Android APK

```bash
cd mobile
flutter build apk --release --dart-define=API_BASE_URL=https://mykuchupuchu.com
scp build/app/outputs/flutter-apk/app-release.apk "$KP_DEPLOY_HOST":mykuchupuchu-data/downloads/my-kuchu-puchu.apk
```

Bump `version:` in `mobile/pubspec.yaml` each time. Add `--dart-define=SHOW_DEMO=false` to hide
the demo-login buttons once real users arrive.

## Reset the live demo data

The clean demo database is kept at `backups/mykuchupuchu-clean-demo.db`:

```bash
ssh "$KP_DEPLOY_HOST" 'D=~/mykuchupuchu-data; pm2 stop mykuchupuchu; cp $D/backups/mykuchupuchu-clean-demo.db $D/mykuchupuchu.db; rm -rf $D/uploads/videos/* $D/uploads/thumbs/* $D/uploads/avatars/* $D/uploads/banners/* $D/uploads/covers/*; pm2 start mykuchupuchu'
```

This removes everything users and creators did since (sign-ups, uploads, likes, withdrawals, follows,
preferences). The clean demo database is already migrated to the current schema; after future
migrations, refresh it the same way (copy → `migrate-deploy.mjs` → save as the new clean demo).

## Demo logins (sample data)

| Role | Email | Password |
|---|---|---|
| Super admin (website) | admin@mykuchupuchu.com | Admin@123 |
| Finance / moderator admins | finance@ / moderator@mykuchupuchu.com | Admin@123 |
| Creator (approved) | meera@mykuchupuchu.com | Creator@123 |
| Creator (pending review) | samir@mykuchupuchu.com | Creator@123 |
| User (app) | user@mykuchupuchu.com | User@1234 |

These are public on the login pages — change or remove them before real users and money are involved.
