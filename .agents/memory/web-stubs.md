---
name: Web stubs for native-only packages
description: How to make the Replit web preview work when native-only packages (PowerSync, azure polyfill) are not installed.
---

## The Problem
`@powersync/react-native` and `@azure/core-asynciterator-polyfill` are Android-only
packages installed locally by the user, not in the Replit container. Metro's
`require.context` bundles ALL files in `app/` for web — including `_layout.tsx` which
imports both packages — causing web bundle failures even when `_layout.web.tsx` exists.

## Solution: metro.config.js resolveRequest

`metro.config.js` intercepts these packages for `platform === 'web'` and redirects them
to local stub files in `stubs/`:

- `stubs/polyfill.js` — empty stub for `@azure/core-asynciterator-polyfill` and
  `@journeyapps/react-native-quick-sqlite`
- `stubs/powersync-react-native.js` — stub that exports `PowerSyncProvider` (passthrough
  React component), `PowerSyncDatabase` (no-op class), `Schema`, `Table`, `column`

## Additional platform files
- `app/_layout.web.tsx` — web layout without PowerSyncProvider wiring (belt + suspenders)
- `lib/powersync.web.ts` — stub powerSyncDb for web; used by lib/database.ts on web
  (Metro platform-extension resolution: `./powersync` → `powersync.web.ts` on web)

**Why:** Metro's `require.context` doesn't respect `.web.tsx` route overrides at
static-import resolution time — it bundles all files in `app/` regardless.

**How to apply:** When adding a new native-only package import that appears in a file
inside `app/` or `lib/` that's also bundled for web: add it to `WEB_STUBS` in
`metro.config.js` and create the corresponding stub.
