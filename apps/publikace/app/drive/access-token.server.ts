import type { GoogleCredentials } from '../auth/environment.server.ts'
import type { DriveAccountStore } from '../data/drive-account.server.ts'
import { now } from '../domain/time.ts'

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

export type DriveAccessToken =
  | { accessToken: string; expiresAt: Temporal.Instant; ok: true }
  | { ok: false; reason: 'disconnected' | 'not-connected' | 'unavailable' }

export type DriveAccessTokenOptions = {
  credentials: GoogleCredentials | null
  fetch?: typeof globalThis.fetch
  store: DriveAccountStore
}

/**
 * A short-lived access token for the Drive account, the one door every call to Drive goes
 * through.
 *
 * It is also what turns the account _Odpojeno_ (`14c`): Google answering `invalid_grant` means
 * the token was revoked, expired unused or replaced, and only connecting again mends that. Any
 * other failure — Google down, a timeout — changes nothing and is `unavailable`, which a Drive
 * action reports as _Disk teď neodpovídá_ (`11c`).
 *
 * Its own request rather than `refreshExternalAuth` from remix/auth, which turns Google's error
 * into the human-readable description and loses the `invalid_grant` this depends on.
 */
export async function driveAccessToken(
  options: DriveAccessTokenOptions,
): Promise<DriveAccessToken> {
  let refreshToken = await options.store.refreshToken(now())
  if (refreshToken === null) {
    let state = await options.store.state()
    return { ok: false, reason: state.status === 'disconnected' ? 'disconnected' : 'not-connected' }
  }
  if (options.credentials === null) return { ok: false, reason: 'unavailable' }

  let response: Response
  try {
    response = await (options.fetch ?? globalThis.fetch)(TOKEN_ENDPOINT, {
      body: new URLSearchParams({
        client_id: options.credentials.clientId,
        client_secret: options.credentials.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      method: 'POST',
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

/** One bounded line: the text can come from Google, and no token is ever in it. */
function logFailure(message: string): void {
  let line = [...message]
    .map((char) => {
      let code = char.codePointAt(0) ?? 0
      return code < 0x20 || (code >= 0x7f && code <= 0x9f) ? ' ' : char
    })
    .join('')
    .slice(0, 200)
  console.error(`[drive] the access token was not refreshed: ${line}`)
}
