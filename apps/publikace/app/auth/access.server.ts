import type { AccessDirectory } from '../data/access.server.ts'
import { isOnDomain, normalizeEmail } from '../domain/access.ts'
import type { MembershipCheck } from './group-membership.server.ts'

/**
 * Who may sign in.
 *
 * Google proves who somebody is; this decides whether they may enter and as whom. An account on
 * the domain is an editor-in-chief when it is named in the access list or is a member of a listed
 * group (`14a`), and a proofreader when it is the address in Nastavení › Korektura or a member of
 * it (`14f`, `10d`). Every refusal is one of the codes `10a` has a message for.
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

/** What the person may do, once let in: at least one of the two is true. */
export type Roles = {
  /** In Přístup, by name or through a listed group: every screen of the editors-in-chief. */
  isEditor: boolean
  /** The proofreaders' address, or a member of it (`03`, row 57): the page Korektura. */
  isProofreader: boolean
}

export type AccessDecision =
  | { allowed: false; email: string; reason: AccessRefusal }
  | {
      allowed: true
      displayName: string
      email: string
      /**
       * Every answer the roles rest on came back. When one did not, the role it would have given
       * is off for now (`03`, _nedostupná služba zamítne_) and the decision is kept for a minute
       * instead of ten (`UNSETTLED_RETRY_MS`).
       */
      isSettled: boolean
      roles: Roles
    }

export type AccessContext = {
  checkMembership: MembershipCheck
  directory: AccessDirectory
  /** Without the `@`. Empty lets nobody in. */
  domain: string
  /** The address in Nastavení › Korektura, `null` while none is set. */
  proofreadersAddress: () => Promise<string | null>
}

/**
 * Decides, failing closed.
 *
 * A named account is an editor-in-chief **without asking the membership service**, so it can sign
 * in while the service is down (`10a`, `unavailable`), and an account that is the proofreaders'
 * address itself is a proofreader the same way. Every listed group and the proofreaders' address
 * are asked at once, so an outage costs one timeout, not one a group, and any membership wins.
 *
 * About the proofreaders' address, the service answering `unknown-group` is a no: the address may
 * be one account, which the service cannot tell from a group it does not know (`14f`).
 *
 * Nobody let in: a "don't know" when some answer did not come back, which is never remembered,
 * and `notlisted` only from a full set of "no".
 */
export async function decideAccess(
  profile: VerifiedProfile,
  { checkMembership, directory, domain, proofreadersAddress }: AccessContext,
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

  let [account, groups, address] = await Promise.all([
    directory.findAccount(email),
    directory.listGroups(),
    proofreadersAddress(),
  ])
  let proofreaders = address === null ? null : normalizeEmail(address)

  let [groupAnswers, proofreaderAnswer] = await Promise.all([
    account === null
      ? Promise.all(groups.map((group) => checkMembership(email, group.email)))
      : Promise.resolve([]),
    proofreaders === null || proofreaders === email
      ? Promise.resolve(null)
      : checkMembership(email, proofreaders),
  ])

  let groupMember = groupAnswers.find((answer) => answer.status === 'member')
  let isEditor = account !== null || groupMember !== undefined
  /* A group the service does not know refuses as a "don't know" (`10a`), as it always has, but it
     does not keep the decision from settling: it will not answer otherwise in a minute, and a
     proofreader let in meanwhile would be asked about every group on every request. */
  let isEditorUnknown = !isEditor && groupAnswers.some((answer) => answer.status !== 'not-member')
  let isEditorUnanswered =
    !isEditor && groupAnswers.some((answer) => answer.status === 'unavailable')

  let isProofreader = proofreaders === email || proofreaderAnswer?.status === 'member'
  let isProofreaderUnknown = proofreaderAnswer?.status === 'unavailable'

  if (!isEditor && !isProofreader) {
    let isUnknown = isEditorUnknown || isProofreaderUnknown
    return { allowed: false, email, reason: isUnknown ? 'unavailable' : 'notlisted' }
  }

  let serviceName = [groupMember, proofreaderAnswer].find((answer) => answer?.status === 'member')
  let displayName =
    (account !== null ? (profile.name ?? account.displayName) : null) ??
    (serviceName?.status === 'member' ? serviceName.displayName : null) ??
    profile.name ??
    email
  return {
    allowed: true,
    displayName,
    email,
    isSettled: !isEditorUnanswered && !isProofreaderUnknown,
    roles: { isEditor, isProofreader },
  }
}
