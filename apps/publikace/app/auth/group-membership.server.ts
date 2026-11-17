import type { GroupMembershipEndpoint } from './environment.server.ts'

/**
 * What `SCRIPT__Auth__Group_Membership` said about one address and one group.
 *
 * `unknown-group` is the service refusing a group missing from its `allowedGroups`; it is told
 * apart from `unavailable` because adding a group in Settings has its own message for it
 * (`14b`). At sign-in both are a "don't know" and neither is ever remembered.
 */
export type MembershipAnswer =
  | { displayName: string | null; status: 'member' }
  | { status: 'not-member' }
  | { status: 'unknown-group' }
  | { status: 'unavailable' }

export type MembershipCheck = (email: string, group: string) => Promise<MembershipAnswer>

type ServiceResponse =
  | { displayName?: unknown; isMember?: unknown; ok: true }
  | { error?: unknown; ok: false }

/**
 * Asks the membership service, one address and one group per request.
 *
 * The secret travels in the body over HTTPS, which is the service's contract (`03`, rozhodnuto
 * 17. 11. 2026). The answer is a yes or a no that writes nothing, so a replayed request gains
 * nothing, and the service's `allowedGroups` bounds what a leaked secret could ask about.
 *
 * Never throws: a timeout, a redirect loop or a body that is not JSON is `unavailable`, a
 * "don't know" rather than a "no".
 */
export function createMembershipCheck(
  endpoint: GroupMembershipEndpoint,
  options: { fetch?: typeof fetch; timeoutMs?: number } = {},
): MembershipCheck {
  let send = options.fetch ?? fetch

  return async (email, group) => {
    try {
      let response = await send(endpoint.url, {
        body: JSON.stringify({ email, group, secret: endpoint.secret }),
        // Apps Script reads the body whatever its type; text/plain needs no CORS preflight.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        method: 'POST',
        // A web app's /exec answers with a redirect to script.googleusercontent.com.
        redirect: 'follow',
        signal: AbortSignal.timeout(options.timeoutMs ?? 5000),
      })

      if (!response.ok) {
        console.error(`[auth] membership service answered HTTP ${response.status}`)
        return { status: 'unavailable' }
      }

      let payload = (await response.json()) as ServiceResponse

      if (payload.ok !== true) {
        let error = typeof payload.error === 'string' ? payload.error : 'unknown'
        if (error === 'unknown_group') return { status: 'unknown-group' }
        /* `unauthorized` is this app's misconfiguration and does not fix itself, so it is
           logged; it still answers "don't know" like every other failure. */
        console.error(`[auth] membership service refused the request: ${error}`)
        return { status: 'unavailable' }
      }

      if (payload.isMember !== true) return { status: 'not-member' }

      let displayName = typeof payload.displayName === 'string' ? payload.displayName : ''
      return { displayName: displayName === '' ? null : displayName, status: 'member' }
    } catch {
      return { status: 'unavailable' }
    }
  }
}

/** The check outside production when the service is not configured: it never knows. */
export const membershipUnavailable: MembershipCheck = async () => ({ status: 'unavailable' })
