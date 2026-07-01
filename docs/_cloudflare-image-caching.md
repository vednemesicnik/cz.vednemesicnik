# Cloudflare caching for image resources

Image variants are served from `/resources/*` as immutable, versioned files. The
`version` token is part of the URL path, so a given URL never changes its bytes —
editing an image produces a **new** URL. This makes the responses safe to cache
forever at the edge, with automatic invalidation (a new version = a new cache key,
so no manual purge is ever needed).

The origin already sends the right headers:

```
Cache-Control: public, max-age=31536000, immutable
```

To keep near-100% edge hit ratio and take the traffic off the origin machine (which
can then suspend), add a Cache Rule so Cloudflare caches these responses.

## Cache Rule

In the Cloudflare dashboard: **Caching → Cache Rules → Create rule**.

- **Rule name:** `Cache image resources`
- **When incoming requests match:**
  - Field `URI Path`, operator `starts with`, value `/resources/`
- **Then:**
  - **Cache eligibility:** `Eligible for cache` (Cache Everything)
  - **Edge TTL:** `Use cache-control header if present, use default otherwise`
    (the origin sends a 1-year `immutable` max-age, so responses are held at the
    edge long-term)
  - **Browser TTL:** `Respect origin`

Because URLs are content-versioned, there is no purge step in the deploy or edit
flow — an edited image simply starts being requested under its new version.

## Notes

- `/resources/*` responses carry no cookies and depend only on the URL, so
  `Cache Everything` is safe (no risk of caching per-user content).
- A `404` for a missing variant is cheap and also cacheable; it only happens for
  URLs that never had a file (e.g. a stale reference), not for valid variants.