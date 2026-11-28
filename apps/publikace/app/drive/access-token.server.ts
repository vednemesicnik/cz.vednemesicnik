import { createHash } from 'node:crypto'

import type { GoogleCredentials } from '../auth/environment.server.ts'
import type { DriveAccountStore } from '../data/drive-account.server.ts'
import { now as currentTime } from '../domain/time.ts'
import { DRIVE_TIMEOUT_MS } from './http.server.ts'
import { logDriveFailure } from './log.server.ts'

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

/** A kept token is asked for again this long before Google's expiry, so no call carries one that dies on the way. */
const KEEP_MARGIN = { minutes: 5 }

export type DriveAccessToken =
  | { accessToken: string; expiresAt: Temporal.Instant; ok: true }
  | { ok: false; reason: 'disconnected' | 'not-connected' | 'unavailable' }

export type DriveTokenOptions = {
  credentials: GoogleCredentials | null
  /** Every call to the token endpoint and to Drive. Defaults to the global `fetch`. */
  fetch?: typeof globalThis.fetch
  now?: () => Temporal.Instant
  store: DriveAccountStore
  timeoutMs?: number
}

/**
 * The access token of the Drive account, one for the process, and the `fetch` the Drive calls
 * go through so that a `401` reaches it.
 */
export type DriveToken = {
  /** The Drive calls' `fetch`: a `401` to the kept token drops it, so the next call refreshes. */
  fetch: typeof globalThis.fetch
  token(): Promise<DriveAccessToken>
}

type Kept = { accessToken: string; expiresAt: Temporal.Instant; grant: string }

/**
 * The one door every call to Drive goes through: a short-lived access token for the Drive
 * account, kept in memory until five minutes before Google's expiry, with concurrent callers
 * sharing one refresh.
 *
 * The stored refresh token is read on every call, and a kept token is used only with the grant
 * it was made from (a digest, so the refresh token itself is not kept): an account marked
 * _Odpojeno_ has none, and connecting it again (`14g`) stores another, so neither needs telling.
 *
 * It is also what turns the account _Odpojeno_ (`14c`): Google answering `invalid_grant` means
 * the token was revoked, expired unused or replaced, and only connecting again mends that. Any
 * other failure — Google down, a timeout — changes nothing and is `unavailable`, which a Drive
 * action reports as _Disk teď neodpovídá_ (`11c`).
 *
 * Its own request rather than `refreshExternalAuth` from remix/auth, which turns Google's error
 * into the human-readable description and loses the `invalid_grant` this depends on.
 */
export function createDriveToken(options: DriveTokenOptions): DriveToken {
  let fetch = options.fetch ?? globalThis.fetch
  let now = options.now ?? currentTime
  let kept: Kept | null = null
  let inFlight: { grant: string; result: Promise<DriveAccessToken> } | null = null

  async function refresh(
    credentials: GoogleCredentials,
    refreshToken: string,
    grant: string,
  ): Promise<DriveAccessToken> {
    let result = await exchange({ ...options, credentials, fetch, now }, refreshToken)
    kept = result.ok
      ? { accessToken: result.accessToken, expiresAt: result.expiresAt, grant }
      : null
    return result
  }

  return {
    async fetch(input, init) {
      let response = await fetch(input, init)
      if (response.status === 401 && kept !== null) {
        let authorization = new Headers(init?.headers).get('Authorization')
        if (authorization === `Bearer ${kept.accessToken}`) kept = null
      }
      return response
    },

    async token() {
      let refreshToken = await options.store.refreshToken(now())
      if (refreshToken === null) {
        kept = null
        let state = await options.store.state()
        return {
          ok: false,
          reason: state.status === 'disconnected' ? 'disconnected' : 'not-connected',
        }
      }
      if (options.credentials === null) return { ok: false, reason: 'unavailable' }

      let grant = createHash('sha256').update(refreshToken).digest('hex')
      if (
        kept !== null &&
        kept.grant === grant &&
        Temporal.Instant.compare(now(), kept.expiresAt.subtract(KEEP_MARGIN)) < 0
      ) {
        return { accessToken: kept.accessToken, expiresAt: kept.expiresAt, ok: true }
      }

      if (inFlight === null || inFlight.grant !== grant) {
        let current = { grant, result: refresh(options.credentials, refreshToken, grant) }
        let settle = () => {
          if (inFlight === current) inFlight = null
        }
        current.result.then(settle, settle)
        inFlight = current
      }
      return inFlight.result
    },
  }
}

type ExchangeOptions = {
  credentials: GoogleCredentials
  fetch: typeof globalThis.fetch
  now: () => Temporal.Instant
  store: DriveAccountStore
  timeoutMs?: number
}

async function exchange(options: ExchangeOptions, refreshToken: string): Promise<DriveAccessToken> {
  let { now } = options
  let response: Response
  try {
    response = await options.fetch(TOKEN_ENDPOINT, {
      body: new URLSearchParams({
        client_id: options.credentials.clientId,
        client_secret: options.credentials.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      method: 'POST',
      signal: AbortSignal.timeout(options.timeoutMs ?? DRIVE_TIMEOUT_MS),
    })
  } catch (error) {
    logFailure(error instanceof Error ? error.message : 'unknown error')
    return { ok: false, reason: 'unavailable' }
  }

  let body = await readJson(response)

  if (response.ok && typeof body['access_token'] === 'string') {
    let seconds = typeof body['expires_in'] === 'number' ? body['expires_in'] : 0
    return {
      accessToken: body['access_token'],
      expiresAt: now().add({ seconds }),
      ok: true,
    }
  }

  if (body['error'] === 'invalid_grant') {
    await options.store.markDisconnected(now())
    return { ok: false, reason: 'disconnected' }
  }

  logFailure(`HTTP ${response.status} ${typeof body['error'] === 'string' ? body['error'] : ''}`)
  return { ok: false, reason: 'unavailable' }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    let value: unknown = await response.json()
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function logFailure(message: string): void {
  logDriveFailure('the access token was not refreshed', message)
}
