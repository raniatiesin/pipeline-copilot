---
name: Web compat — PowerSync + Supabase on Expo web
description: How to make @powersync/react-native and Supabase work in the Expo web (Metro) + SSR environment without crashing.
---

## Problem 1 — @powersync/react-native crashes on web
`@powersync/react-native/dist/index.js` calls `require('react-native')` at the top of the file (not lazily). Metro evaluates this at bundle init for web, hitting `NativeBlobModule` and returning a 500.

**Fix:** `metro.config.js` custom `resolveRequest`:
- On `platform === 'web'`: alias `@powersync/react-native` → `@powersync/web`
- On `platform === 'web'`: return `{ type: 'empty' }` for `@journeyapps/react-native-quick-sqlite`

**Why:** Platform-specific layout files (`_layout.web.tsx`) are not enough — Metro still evaluates every import transitively before it knows which layout to use.

## Problem 2 — Supabase SSR crash on Node.js < 22
Expo Router does SSR via `node/render.js` during web bundling. `createClient` from `@supabase/supabase-js` is evaluated in that Node 20 context, which has no native `WebSocket`. Supabase throws immediately.

**Fix:** In `lib/supabase.ts`, detect `typeof window === 'undefined'` (SSR/Node) and pass `require('ws')` as `realtime.transport`:
```ts
const isNodeSSR = typeof window === 'undefined';
const wsTransport = isNodeSSR ? require('ws') : undefined;
export const supabase = createClient(url, key, {
  ...(isNodeSSR && { realtime: { transport: wsTransport } }),
});
```
`ws` is already a transitive dependency (no install needed).

**How to apply:** Any time `lib/supabase.ts` is modified, preserve the `isNodeSSR` guard.
