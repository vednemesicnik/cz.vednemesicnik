# 0063. `window.ENV` is written into the document

- Date: 2026-11-02
- Issues: PR #937

## Context

`window.ENV` came from a classic script, `/resources/env.js`. The `_meta.ts` files read the
bare global `ENV.BASE_URL`, and `<Meta />` calls them while the page hydrates. Measured on
a production build, a 503 from `env.js` replaced a fully rendered page with "Application
Error". `initSentryClient` reads `window.ENV` too, so the browser SDK stayed off on exactly
that load, and Sentry never heard about it. PR #937 fixed the order of the two scripts, not
the request that could fail.

## Outcome

`Layout` in `app/root.tsx` writes `window.ENV` as an inline script before `<Scripts />`
(`app/utils/create-env-script.ts`), and the `env.js` route is gone. A document that can
hydrate has `ENV`, because the same response carries both. The script reads the bare `ENV`, so
it needs no loader data and also renders on error boundaries, where root loader data can be
missing.

## What follows

- A CSP (log 0002) has one more inline script to cover. `<ScrollRestoration />`, `<Scripts />`
  and the streamed data scripts are inline already, so such a policy has to allow inline scripts
  anyway. This one's text only changes with the configuration, so a hash covers it without a
  nonce reaching `Layout`. A policy that misses it breaks every page, because `Layout` reads
  `ENV` too, so test it on a production build.
- Only client-safe values go in `getEnv`, as before. They were public in `env.js`, and now they
  are in every document.
- Cloudflare documents that Email Address Obfuscation skips `<script>`, which matters because
  a DSN has an `@`. Worth reading `window.ENV.SENTRY_DSN` once in production after release.

## Turned down

- **Meta functions take `BASE_URL` from the root loader.** Every `_meta.ts` changes and needs a
  fallback for error boundaries, and `env.js` stays, so the SDK is still off on the failed load
  that most needs reporting.
- **Meta functions fall back to `location.origin`.** The same files, the SDK still off, and a
  proxied host could reach the canonical and Open Graph URLs on a client navigation.
- **Keep `env.js` and guard the reads.** It keeps a blocking request in front of `<Scripts />`
  on every load, for three values the server already has when it renders the document.
