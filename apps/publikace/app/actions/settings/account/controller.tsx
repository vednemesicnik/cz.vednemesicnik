import { createGoogleAuthProvider, finishExternalAuth, startExternalAuth } from 'remix/auth'
import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { GoogleCredentials } from '../../../auth/environment.server.ts'
import type { SignedInUntilCookie } from '../../../auth/session.server.ts'
import {
  connectedToast,
  type ConnectionRefusal,
  decideConnection,
  DRIVE_SCOPE,
} from '../../../domain/drive-account.ts'
import { now } from '../../../domain/time.ts'
import { Access } from '../../../middleware/access.server.ts'
import { type Person, requireEditor } from '../../../middleware/auth.server.ts'
import {
  DriveAccount,
  type DriveAccountContext,
  flashConnectRefusal,
} from '../../../middleware/drive-account.server.ts'
import { flashToast } from '../../../middleware/toasts.server.ts'
import { routes } from '../../../routes.ts'

/** The OAuth client and the origin Google sends the browser back to. */
export type DriveAccountClient = { credentials: GoogleCredentials | null; origin: string }

/**
 * The Google client asking for the Drive account, or `null` when no client is configured outside
 * production. Built once per domain and account, the two things it is asked with.
 *
 * The same OAuth client as the sign-in, with its own return address and the `drive` scope.
 * `login_hint` makes Google offer `publikace.app@` first, because the account it would otherwise
 * offer is the one signed in in the browser — the editor-in-chief's own (`14h`). `offline` and
 * `consent` make it hand over a refresh token every time, also to an account connected before.
 */
function createProvider({ credentials, origin }: DriveAccountClient) {
  let cached: { key: string; provider: ReturnType<typeof createGoogleAuthProvider> } | undefined

  return (domain: string, expectedEmail: string) => {
    if (credentials === null) return null

    let key = [domain, expectedEmail].join('\n')
    if (cached?.key !== key) {
      cached = {
        key,
        provider: createGoogleAuthProvider({
          authorizationParams: {
            access_type: 'offline',
            hd: domain,
            login_hint: expectedEmail,
            prompt: 'consent',
          },
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          redirectUri: new URL(routes.settings.account.callback.href(), origin),
          scopes: ['openid', 'email', DRIVE_SCOPE],
        }),
      }
    }

    return cached.provider
  }
}

function backToAccounts(): Response {
  return redirect(`${routes.settings.index.href()}#accounts`, 303)
}

/**
 * What `completeDriveConnection` reads off the request. Loose, because the controller's context
 * carries the auth entry its middleware adds and `AppContext` does not; the values are read back
 * by their keys.
 */
type ConnectContext = { get(key: unknown): unknown }

/** What the return from Google carries, as far as connecting needs it. */
export type DriveConnectionReturn = {
  claims: Record<string, unknown>
  refreshToken: string | undefined
  scopes: readonly string[]
}

/**
 * What happens once Google answered; exported so it is tested without Google.
 *
 * A refusal writes nothing: the account stays as it was, connected or not (`14h`). The editor's
 * own sign-in is never touched — this is not a sign-in, and `completeAuth()` would rotate it.
 */
export async function completeDriveConnection(
  context: ConnectContext,
  editor: Person,
  returned: DriveConnectionReturn,
): Promise<Response> {
  let { expectedEmail, store } = context.get(DriveAccount) as DriveAccountContext
  let session = context.get(Session) as Session
  let email = typeof returned.claims.email === 'string' ? returned.claims.email : ''

  let decision = decideConnection(
    {
      email,
      hasRefreshToken: returned.refreshToken !== undefined && returned.refreshToken !== '',
      isEmailVerified: returned.claims.email_verified === true,
      scopes: returned.scopes,
    },
    expectedEmail,
  )

  if (!decision.ok || returned.refreshToken === undefined) {
    let refusal: ConnectionRefusal = { reason: 'failed' }
    if (!decision.ok) {
      let { ok: _ok, ...rest } = decision
      refusal = rest
    }
    flashConnectRefusal(session, refusal)
    return backToAccounts()
  }

  await store.connect({
    at: now(),
    by: editor.email,
    email: expectedEmail,
    refreshToken: returned.refreshToken,
  })
  flashToast({ get: () => session }, connectedToast(expectedEmail))
  return backToAccounts()
}

export default function createDriveAccountController(
  signedInUntil: SignedInUntilCookie,
  client: DriveAccountClient,
) {
  let provider = createProvider(client)

  return createController(routes.settings.account, {
    /* An expired sign-in comes back to Settings, not to the callback: its code is spent once
       used, and a second visit could only fail. */
    middleware: [requireEditor(signedInUntil, routes.settings.index.href())],
    actions: {
      async connect(context) {
        let google = provider(context.get(Access).domain, context.get(DriveAccount).expectedEmail)
        if (google === null) {
          flashConnectRefusal(context.get(Session), { reason: 'failed' })
          return backToAccounts()
        }

        return await startExternalAuth(google, context, { returnTo: null })
      },

      async callback(context) {
        let google = provider(context.get(Access).domain, context.get(DriveAccount).expectedEmail)
        if (google === null) {
          flashConnectRefusal(context.get(Session), { reason: 'failed' })
          return backToAccounts()
        }

        let finished
        try {
          finished = await finishExternalAuth(google, context)
        } catch (error) {
          /* A cancelled consent comes back as `error=access_denied` and grants nothing, so it is
             told like a missing Drive permission (`14h`). The rest — an expired transaction,
             Google being down — can only be tried again. The message alone, on one bounded
             line: the error object can carry the token exchange. */
          let message = error instanceof Error ? error.message : 'unknown error'
          let line = [...message]
            .map((char) => {
              let code = char.codePointAt(0) ?? 0
              let isBreaking = code < 0x20 || (code >= 0x7f && code <= 0x9f)
              return isBreaking || code === 0x2028 || code === 0x2029 ? ' ' : char
            })
            .join('')
            .slice(0, 200)
          console.error(`[drive] connecting the account did not finish: ${line}`)
          let isCancelled = context.url.searchParams.get('error') === 'access_denied'
          flashConnectRefusal(context.get(Session), {
            reason: isCancelled ? 'no-drive-scope' : 'failed',
          })
          return backToAccounts()
        }

        return completeDriveConnection(context, context.auth.identity, {
          claims: finished.result.profile as unknown as Record<string, unknown>,
          refreshToken: finished.result.tokens.refreshToken,
          scopes: finished.result.tokens.scope ?? [],
        })
      },
    },
  })
}
