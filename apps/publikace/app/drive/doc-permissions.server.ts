import type { MembershipCheck } from '../auth/group-membership.server.ts'
import type { VerifiedIdentity } from '../auth/identity-token.server.ts'
import { normalizeEmail } from '../domain/access.ts'
import { createDriveCall, describe, FILES_ENDPOINT, readJson } from './http.server.ts'
import { logDriveFailure } from './log.server.ts'

/**
 * Whether an address may edit a Doc, as Drive answers it to `publikace.app@`. The Doc's menu is no
 * gate of its own: the app's API is public and a Doc's ID is in its address, so the app asks
 * Drive itself before the menu records anything (#50).
 *
 * The list holds the shared drive's members as well as the Doc's own grants. Editing is
 * `writer` and above; a grant counts for the address directly, through a group, through its
 * domain, or for anyone with the link. Any grant that says yes wins; a group the membership
 * service cannot answer for leaves a "don't know" only when nothing else said yes.
 */

export type EditAnswer = 'no' | 'unavailable' | 'yes'

export type Editor = Pick<VerifiedIdentity, 'email' | 'hostedDomain'>

export type DocPermissions = { canEdit(fileId: string, editor: Editor): Promise<EditAnswer> }

const EDITING_ROLES = new Set(['fileOrganizer', 'organizer', 'owner', 'writer'])

type Grant = { domain: string | null; email: string | null; role: string; type: string }

function toGrant(value: unknown): Grant | null {
  if (typeof value !== 'object' || value === null) return null
  let record = value as Record<string, unknown>
  if (typeof record['type'] !== 'string' || typeof record['role'] !== 'string') return null
  return {
    domain: typeof record['domain'] === 'string' ? record['domain'].toLowerCase() : null,
    email:
      typeof record['emailAddress'] === 'string' ? normalizeEmail(record['emailAddress']) : null,
    role: record['role'],
    type: record['type'],
  }
}

export function createDocPermissions(options: {
  accessToken: string
  checkMembership: MembershipCheck
  fetch: typeof globalThis.fetch
}): DocPermissions {
  let call = createDriveCall(options.accessToken, options.fetch)

  /** Every grant on the file, page by page; `no` when Drive does not show it the file at all. */
  async function grantsOf(fileId: string): Promise<Grant[] | 'no' | 'unavailable'> {
    let grants: Grant[] = []
    let pageToken: string | null = null
    do {
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}/permissions`)
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('pageSize', '100')
      url.searchParams.set('fields', 'nextPageToken,permissions(type,role,emailAddress,domain)')
      if (pageToken !== null) url.searchParams.set('pageToken', pageToken)
      let response = await call('listing a Doc’s permissions', url)
      if (response === null) return 'unavailable'
      let body = await readJson(response)
      /* A file `publikace.app@` cannot see is one nobody can mark through the app. */
      if (response.status === 403 || response.status === 404) return 'no'
      if (!response.ok) {
        logDriveFailure('listing a Doc’s permissions', describe(response, body))
        return 'unavailable'
      }
      let listed = Array.isArray(body['permissions']) ? body['permissions'] : []
      for (let value of listed) {
        let grant = toGrant(value)
        if (grant !== null) grants.push(grant)
      }
      pageToken = typeof body['nextPageToken'] === 'string' ? body['nextPageToken'] : null
    } while (pageToken !== null)
    return grants
  }

  return {
    async canEdit(fileId, editor) {
      let address = normalizeEmail(editor.email)
      let grants = await grantsOf(fileId)
      if (grants === 'no' || grants === 'unavailable') return grants

      let editing = grants.filter((grant) => EDITING_ROLES.has(grant.role))
      let isGranted = editing.some(
        (grant) =>
          grant.type === 'anyone' ||
          (grant.type === 'domain' &&
            editor.hostedDomain !== null &&
            grant.domain === editor.hostedDomain) ||
          (grant.type === 'user' && grant.email === address),
      )
      if (isGranted) return 'yes'

      let isUnknown = false
      for (let grant of editing) {
        if (grant.type !== 'group' || grant.email === null) continue
        let answer = await options.checkMembership(address, grant.email)
        if (answer.status === 'member') return 'yes'
        if (answer.status !== 'not-member') isUnknown = true
      }
      return isUnknown ? 'unavailable' : 'no'
    },
  }
}
