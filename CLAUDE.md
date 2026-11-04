# Notes for Claude

- **iOS app (on the Mac):** follow [docs/ios-app.md](docs/ios-app.md). It covers setup, the rules,
  the App Store steps and a status log. Work on the `ios-app` branch.
- **This GitHub repo is public.** Never commit any of these:
  - server addresses or logins;
  - credentials or signing keys;
  - Apple Team IDs;
  - personal details or local user paths.
- **https://mykuchupuchu.com is production**, with real creators.
  - Website deploys run only from the owner's Windows PC: `deploy/redeploy.sh` reads a git-ignored
    `deploy/.deploy.env`.
  - The mobile apps only read from the site.
- More docs:
  - `docs/deploy.md` (website);
  - `docs/store-submission.md` (Play and App Store answers);
  - `mobile/README.md` (the Flutter app).
