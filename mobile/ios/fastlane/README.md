fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios check

```sh
[bundle exec] fastlane ios check
```

Read-only: the bundle ID, the app record and the distribution certificates on the team

### ios register_bundle_id

```sh
[bundle exec] fastlane ios register_bundle_id
```

Register the bundle ID kuchupuchu.com (safe to re-run)

### ios signing

```sh
[bundle exec] fastlane ios signing
```

Fetch the App Store profile (made with the distribution certificate already in this Mac's keychain)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
