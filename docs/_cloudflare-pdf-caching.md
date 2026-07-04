# Cloudflare caching for issue PDFs

Issue PDFs are served from a **stable** URL — `/archive/<file>.pdf`. The filename does
not change when a PDF is re-uploaded to the same issue, so the URL cannot be treated as
immutable: a long `max-age` would let a replaced PDF go stale.

Instead the origin sends a revalidate-always header:

```
Cache-Control: public, no-cache
```

`no-cache` means the response **may** be stored (browser and edge) but must be
revalidated before reuse. Revalidation is a cheap conditional request against the ETag,
which the route loader builds from `fileName + updatedAt`
(`app/routes/website/archive/issue-pdf/_loader.ts`); the `no-cache` header itself is
`PDF_CACHE_CONTROL` in `app/utils/pdf-store/serve-pdf.server.ts`. So repeat downloads
are `304`s when the PDF is unchanged, and pick up a re-upload immediately. Same strategy
as the `env.js` resource.

## The problem this rule fixes

Cloudflare has a global **Browser Cache TTL** default (4 h) that **overrides** the origin
`Cache-Control` for the browser-facing response. Without a rule, the eyeball response was
observed as `cache-control: public, max-age=14400` — so browsers cached PDFs for up to
4 h **without revalidating**, and would show a stale PDF for up to 4 h after a re-upload.

Images are unaffected: their `/resources/` Cache Rule already sets **Browser TTL: Respect
origin TTL** (see `_cloudflare-image-caching.md`). PDFs had no rule, so the global default
applied. The rule below closes that gap.

## Cache Rule

In the Cloudflare dashboard: **Caching → Cache Rules → Create rule**.

- **Rule name:** `Cache issue PDFs`
- **When incoming requests match** (Custom filter expression):
  ```
  (starts_with(http.request.uri.path, "/archive/")) and (ends_with(http.request.uri.path, ".pdf"))
  ```
- **Then:**
  - **Browser TTL:** `Respect origin TTL` ← the fix. This passes the origin `no-cache`
    through instead of the global 4 h default, so browsers revalidate every time.
  - **Edge TTL:** `Use cache-control header if present, bypass cache if not`

## Notes

- The expression is scoped to `/archive/*.pdf`, so no other route is touched — only the
  issue-PDF download endpoint gets `Respect origin TTL`.
- The ETag-based revalidation makes the edge/browser cache effectively free: unchanged
  PDFs return `304`, a re-uploaded PDF (new `updatedAt`) returns fresh bytes on the next
  request.
