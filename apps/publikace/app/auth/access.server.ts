import type { AccessDirectory } from '../data/access.server.ts'
import { isOnDomain, normalizeEmail } from '../domain/access.ts'
import type { MembershipCheck } from './group-membership.server.ts'

/**
 * Who may sign in.
 *
 * Google proves who somebody is; this decides whether they may enter. An account on the
 * domain may, when it is named in the access list or is a member of a listed group (`14a`).
 * Every refusal is one of the codes `10a` has a message for.
 */

/** The identity Google vouched for. */
export type VerifiedProfile = {
  email: string
  emailVerified: boolean
  /** The Workspace domain of the account, or `null` for a personal one. */
  hostedDomain: string | null
  name: string | null
}

export type AccessRefusal = 'domain' | 'notlisted' | 'unavailable'

export type AccessDecision =
  | { allowed: false; email: string; reason: AccessRefusal }
  | { allowed: true; displayName: string; email: string }

export type AccessContext = {
  checkMembership: MembershipCheck
  directory: AccessDirectory
  /** Without the `@`. Empty lets nobody in. */
  domain: string
}

/**
 * Decides, failing closed.
 *
 * A named account is let in **without asking the membership service**, so it can sign in
 * while the service is down (`10a`, `unavailable`). Otherwise every group is asked and any
 * membership wins. When no group says yes and any of them could not be asked, the
 * answer is `unavailable` — a "don't know", which is never remembered — and only a full set of
 * "no" is `notlisted`.
 */
export async function decideAccess(
  profile: VerifiedProfile,
  { checkMembership, directory, domain }: AccessContext,
): Promise<AccessDecision> {
  let email = normalizeEmail(profile.email)

  /* Both the address and the Workspace that issued it: an address on the domain alone could be
     a personal Google account somebody registered with it. */
  if (
    !profile.emailVerified ||
    !isOnDomain(email, domain) ||
    profile.hostedDomain?.toLowerCase() !== domain
  ) {
    return { allowed: false, email, reason: 'domain' }
  }

  let account = await directory.findAccount(email)
  if (account !== null) {
    return { allowed: true, displayName: profile.name ?? account.displayName ?? email, email }
  }

  // All groups at once: while the service is down, a request waits one timeout, not one a group.
  let groups = await directory.listGroups()
  let answers = await Promise.all(groups.map((group) => checkMembership(email, group.email)))

  for (let answer of answers) {
    if (answer.status === 'member') {
      return { allowed: true, displayName: answer.displayName ?? profile.name ?? email, email }
    }
  }

  let hasUnknown = answers.some((answer) => answer.status !== 'not-member')
  return { allowed: false, email, reason: hasUnknown ? 'unavailable' : 'notlisted' }
}
