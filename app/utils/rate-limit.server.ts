import { timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { createContext, data, type MiddlewareFunction } from 'react-router'

import { getRateLimitSubject } from './get-rate-limit-subject.server'

// --- Store ----------------------------------------------------------------

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  resetAt: number // epoch ms
}

export type RateLimitStore = {
  hit(
    key: string,
    limit: number,
    windowMs: number,
  ): RateLimitResult | Promise<RateLimitResult>
}

// In-memory fixed window. Per-instance only — swap implementation for multi-machine deployments.
function createInMemoryFixedWindowStore(): RateLimitStore {
  const buckets = new Map<string, { count: number; resetAt: number }>()
  let hitsSinceSweep = 0
  let lastSweep = Date.now()

  const sweep = (now: number) => {
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key)
    }
    hitsSinceSweep = 0
    lastSweep = now
  }

  return {
    hit(key, limit, windowMs) {
      const now = Date.now()
      let bucket = buckets.get(key)

      if (!bucket || now >= bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs }
      }

      bucket.count += 1
      buckets.set(key, bucket)

      // Sweep on a hit-count OR elapsed-time trigger, so expired buckets can't
      // accumulate unbounded under low traffic or many one-off keys (a bucket
      // lives at most `windowMs`, so a time-based sweep bounds the map size).
      if (++hitsSinceSweep >= 1000 || now - lastSweep >= windowMs) {
        sweep(now)
      }

      return {
        limit,
        ok: bucket.count <= limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.resetAt,
      }
    },
  }
}

// Single instance that survives HMR in dev.
const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: RateLimitStore
}

if (!globalForRateLimit.__rateLimitStore) {
  globalForRateLimit.__rateLimitStore = createInMemoryFixedWindowStore()
}

export const rateLimitStore: RateLimitStore =
  globalForRateLimit.__rateLimitStore

// --- IP -------------------------------------------------------------------

// Whether our Cloudflare zone sent this request: a Transform Rule adds the secret.
// Cloudflare's ranges would not prove it, since another account's Worker connects from
// them and sets CF-Connecting-IP as it likes on a request to the origin (log 0058).
const isFromOurCloudflareZone = (request: Request): boolean => {
  const secret = process.env.CLOUDFLARE_ORIGIN_SECRET
  const sent = request.headers.get('X-Origin-Secret')
  if (!secret || !sent) return false

  const secretBuffer = Buffer.from(secret)
  const sentBuffer = Buffer.from(sent)

  return (
    secretBuffer.length === sentBuffer.length &&
    timingSafeEqual(secretBuffer, sentBuffer)
  )
}

// Fly-Client-IP is whoever connected to Fly (Fly overwrites it, so clients can't set
// it): behind Cloudflare that is the edge, and the client is in CF-Connecting-IP. The
// origin is reachable directly, so that header counts only on a request from our zone.
// X-Forwarded-For is client-controlled and therefore spoofable, so only fall back to it
// outside production (local dev, where there is no Fly-Client-IP). In production a
// missing Fly-Client-IP collapses to a single "unknown" bucket rather than a per-request
// spoofable one.
export function getClientIp(request: Request): string {
  const flyClientIp = request.headers.get('Fly-Client-IP')
  if (flyClientIp) {
    const cloudflareClientIp = request.headers.get('CF-Connecting-IP')
    const isClientKnown =
      cloudflareClientIp &&
      isIP(cloudflareClientIp) !== 0 &&
      isFromOurCloudflareZone(request)

    return isClientKnown ? cloudflareClientIp : flyClientIp
  }

  if (process.env.NODE_ENV !== 'production') {
    const forwardedFor = request.headers
      .get('X-Forwarded-For')
      ?.split(',')[0]
      ?.trim()
    if (forwardedFor) return forwardedFor
  }

  return 'unknown'
}

// --- Context --------------------------------------------------------------

// Signal for the action: limit exceeded → return inline error without triggering ErrorBoundary.
export const rateLimitContext = createContext<{ retryAfter: number } | null>(
  null,
)

// --- Headers --------------------------------------------------------------

// Standard RateLimit-* headers (draft-6 style) + Retry-After when limit is exceeded.
function applyRateLimitHeaders(
  target: Headers,
  result: RateLimitResult,
  resetSeconds: number,
) {
  target.set('RateLimit-Limit', String(result.limit))
  target.set('RateLimit-Remaining', String(result.remaining))
  target.set('RateLimit-Reset', String(resetSeconds))
  if (!result.ok) target.set('Retry-After', String(resetSeconds))
}

// --- Factory --------------------------------------------------------------

type RateLimitMiddlewareOptions = {
  /** Key prefix that isolates limits between routes (e.g. "request-confirmation"). */
  key: string
  /** Maximum number of requests allowed within the window. */
  limit: number
  /** Window duration in ms. */
  windowMs: number
  /**
   * Behaviour when the limit is exceeded:
   * - "context" (default): sets rateLimitContext so the action returns an inline error
   * - "throw": throws a 429 response → caught by ErrorBoundary
   */
  onLimit?: 'context' | 'throw'
  /** Custom store (default: shared in-memory store). */
  store?: RateLimitStore
}

export function createRateLimitMiddleware(
  options: RateLimitMiddlewareOptions,
): MiddlewareFunction<Response> {
  const {
    key,
    limit,
    windowMs,
    onLimit = 'context',
    store = rateLimitStore,
  } = options

  return async ({ request, context }, next) => {
    // Only limit submissions, not page loads / loaders. Anything else reaches the
    // action: React Router runs it for PUT, PATCH and DELETE as well as POST.
    if (request.method === 'GET' || request.method === 'HEAD') return next()

    const subject = getRateLimitSubject(getClientIp(request))
    const result = await store.hit(`${key}:${subject}`, limit, windowMs)
    const resetSeconds = Math.max(
      0,
      Math.ceil((result.resetAt - Date.now()) / 1000),
    )

    // "throw" mode cuts the chain immediately — headers must go on the thrown response
    // because the post-next block below won't run in this branch.
    if (!result.ok && onLimit === 'throw') {
      const headers = new Headers()
      applyRateLimitHeaders(headers, result, resetSeconds)
      throw data(
        { error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.' },
        { headers, status: 429 },
      )
    }

    if (!result.ok) {
      context.set(rateLimitContext, { retryAfter: resetSeconds })
    }

    // Apply headers to the outgoing response — the single place for both returned
    // responses (success, 429 from the action) and thrown ones (redirects, thrown
    // `data()`), so the RateLimit-* headers are attached consistently either way.
    try {
      const response = await next()
      if (response instanceof Response) {
        applyRateLimitHeaders(response.headers, result, resetSeconds)
      }
      return response
    } catch (thrown) {
      if (thrown instanceof Response) {
        applyRateLimitHeaders(thrown.headers, result, resetSeconds)
      }
      throw thrown
    }
  }
}
