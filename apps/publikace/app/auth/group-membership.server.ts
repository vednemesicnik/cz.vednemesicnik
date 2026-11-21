import type { GroupMembershipEndpoint } from './environment.server.ts'

/**
 * What `SCRIPT__Auth__Group_Membership` said about one address and one group.
 *
 * `unknown-group` is the service refusing a group missing from its `allowedGroups`; it is told
 * apart from `unavailable` because adding a group in Settings has its own message for it
 * (`14b`). At sign-in both are a "don't know" and neither is ever remembered.
 *
 * `groupName` is the group's name in Google Workspace, on a yes and on a no alike, because adding
 * a group asks with the administrator's own address, which is usually not in it. It is `null`
 * when the service sent none: an older deployment, or a name the directory did not give.
 */
export type MembershipAnswer =
  | { displayName: string | null; groupName: string | null; status: 'member' }
  | { groupName: string | null; status: 'not-member' }
  | { status: 'unknown-group' }
  | { status: 'unavailable' }

export type MembershipCheck = (email: string, group: string) => Promise<MembershipAnswer>

type ServiceResponse =
  | { displayName?: unknown; groupName?: unknown; isMember?: unknown; ok: true }
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

      let groupName = nonEmptyText(payload.groupName)
      if (payload.isMember !== true) return { groupName, status: 'not-member' }

      return { displayName: nonEmptyText(payload.displayName), groupName, status: 'member' }
    } catch {
      return { status: 'unavailable' }
    }
  }
}

/** A field the service may leave out: a string with something in it, otherwise `null`. */
function nonEmptyText(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

/** The check outside production when the service is not configured: it never knows. */
export const membershipUnavailable: MembershipCheck = async () => ({ status: 'unavailable' })

/**
 * Hands every group name the service sends to `record`, then returns the answer untouched.
 *
 * Wrapping the check keeps a listed group's name current wherever the service is asked — at
 * sign-in, at the ten-minute re-check and when a group is added — without any
 * of them knowing about names. A name decides nothing, so a name that could not be recorded is
 * logged and the answer stands.
 */
export function rememberGroupNames(
  check: MembershipCheck,
  record: (group: string, name: string) => Promise<void>,
): MembershipCheck {
  return async (email, group) => {
    let answer = await check(email, group)
    if (
      (answer.status === 'member' || answer.status === 'not-member') &&
      answer.groupName !== null
    ) {
      try {
        await record(group, answer.groupName)
      } catch (error) {
        console.error('[auth] could not record a group name', error)
      }
    }
    return answer
  }
}
