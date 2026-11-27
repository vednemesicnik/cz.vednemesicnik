import type { IdentityTokenVerifier } from '../../auth/identity-token.server.ts'
import type { JobRunStore } from '../../data/job-runs.server.ts'

/**
 * What every call of a background job to the app's API goes through: the job's Google identity
 * token as a bearer, checked for the job account, and a JSON body (`AGENTS.md`, the API is public,
 * so every call proves who made it). The answers are never cached.
 */

export type JobCaller = {
  /** The account the jobs run as, in lower case. */
  jobAccount: string
  verifyIdentityToken: IdentityTokenVerifier
}

/* A trigger fires at most once a minute and at least once a day. */
const MAX_INTERVAL_MINUTES = 24 * 60

const NO_STORE = { 'Cache-Control': 'no-store' }

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { headers: NO_STORE, status })
}

function bearerOf(request: Request): string | null {
  let match = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '')
  return match?.[1] ?? null
}

/**
 * `null` when the token is the job account's; otherwise the answer that refuses the call: 401
 * without a token or for another account, 503 when Google could not be asked.
 */
export async function refusal(request: Request, caller: JobCaller): Promise<Response | null> {
  let bearer = bearerOf(request)
  if (bearer === null) return json({ error: 'unauthorized' }, 401)
  let check = await caller.verifyIdentityToken(bearer)
  if (check.status === 'unavailable') return json({ error: 'unavailable' }, 503)
  if (check.status !== 'verified' || check.identity.email.toLowerCase() !== caller.jobAccount) {
    return json({ error: 'unauthorized' }, 401)
  }
  return null
}

/*
 * The largest real body of any job is an approvals report: a hundred results and a hundred replies
 * of a few kilobytes, under a megabyte. The limit leaves it room many times over and keeps a job
 * gone wrong from being read whole into memory.
 */
export const MAX_BODY_BYTES = 8 * 1024 * 1024

/** The bytes of the body, or `null` once they pass `MAX_BODY_BYTES`. */
async function bytesOf(request: Request): Promise<Uint8Array | null> {
  let reader = request.body?.getReader()
  if (reader === undefined) return new Uint8Array()
  let chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    let { done, value } = await reader.read()
    if (done || value === undefined) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  let bytes = new Uint8Array(total)
  let offset = 0
  for (let chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/**
 * The body as an object, or `null` for anything else, a body over `MAX_BODY_BYTES` included: one
 * that says so in `Content-Length` is not read at all, one that does not stops being read there.
 */
export async function bodyOf(request: Request): Promise<Record<string, unknown> | null> {
  let length = Number(request.headers.get('Content-Length') ?? '')
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null
  try {
    let bytes = await bytesOf(request)
    if (bytes === null) return null
    let body: unknown = JSON.parse(new TextDecoder().decode(bytes))
    return typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value !== '' && value.length <= max
}

/** The trigger's interval a run opens with, or `null` when it is not a whole number of minutes. */
export function intervalOf(body: Record<string, unknown> | null): number | null {
  let interval = body?.['intervalMinutes']
  return typeof interval === 'number' &&
    Number.isInteger(interval) &&
    interval >= 1 &&
    interval <= MAX_INTERVAL_MINUTES
    ? interval
    : null
}

const MAX_START_KEY_LENGTH = 200

/**
 * Opens the run a claim starts, under a new key, and answers with that key. A run started by hand
 * carries the `startKey` the app gave its `doPost` (`14e`), which makes it that start's run: one
 * that is not text is refused with 400, and one that is not an unredeemed start of this job with
 * 409 `unknown_start`, with nothing opened. Without a key the run is the trigger's.
 */
export async function openRun(
  runs: JobRunStore,
  run: {
    at: Temporal.Instant
    body: Record<string, unknown> | null
    intervalMinutes: number
    job: string
  },
): Promise<{ runKey: string } | { refused: Response }> {
  let startKey = run.body?.['startKey']
  if (startKey !== undefined && !isText(startKey, MAX_START_KEY_LENGTH)) {
    return { refused: json({ error: 'invalid_request' }, 400) }
  }
  let runKey = crypto.randomUUID()
  let isOpened = await runs.start({
    at: run.at,
    intervalMinutes: run.intervalMinutes,
    job: run.job,
    runKey,
    ...(startKey === undefined ? {} : { startKey }),
  })
  if (!isOpened) return { refused: json({ error: 'unknown_start' }, 409) }
  return { runKey }
}
