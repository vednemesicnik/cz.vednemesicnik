# 0002. Defer the nonce-based Content-Security-Policy

- Date: 2026-07-09
- Issues: #131, #185, PR #182, PR #184

## Context

A nonce-based CSP was built (PR #182). On React Router 8.2 one nonce feeds `<Links>`,
`<Scripts>` and the single-fetch streaming scripts at once. Nonced `<link>` elements break
hydration on every page, and the streaming scripts lose the nonce in production
(react-router#15083).

## Outcome

The nonce CSP is reverted (PR #184) and deferred in #185. The baseline security headers,
`frame-ancestors 'none'` among them, stay in `app/entry.server.tsx`.

## What follows

- Revisit only when React Router fixes #15083 or stops noncing `<Links>`, or on a React
  Router upgrade — test it on a production build, not the dev server.
