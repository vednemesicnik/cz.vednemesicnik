import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { MembershipAnswer, MembershipCheck } from '../auth/group-membership.server.ts'
import { createDocPermissions } from './doc-permissions.server.ts'

const JAKUB_ADDRESS = 'jakub.novak@vednemesicnik.test'
const JAKUB = { email: JAKUB_ADDRESS, hostedDomain: 'vednemesicnik.test' }

/** Drive answering the permission list with `pages`, one per request, recording the URLs. */
function listing(...pages: unknown[]) {
  let urls: string[] = []
  let fetch: typeof globalThis.fetch = async (url) => {
    urls.push(String(url))
    return Response.json(pages[urls.length - 1] ?? { permissions: [] })
  }
  return { fetch, urls }
}

function membership(answers: Record<string, MembershipAnswer> = {}): MembershipCheck {
  return async (_email, group) => answers[group] ?? { groupName: null, status: 'not-member' }
}

function permissions(fetch: typeof globalThis.fetch, checkMembership = membership()) {
  return createDocPermissions({ accessToken: 'test-access-token', checkMembership, fetch })
}

describe('whether an address may edit a Doc', () => {
  it('asks the shared drive for every grant, page by page, and finds the address among them', async () => {
    let drive = listing(
      { nextPageToken: 'p2', permissions: [{ role: 'reader', type: 'anyone' }] },
      {
        permissions: [
          { emailAddress: 'Jakub.Novak@vednemesicnik.test', role: 'writer', type: 'user' },
        ],
      },
    )

    assert.equal(await permissions(drive.fetch).canEdit('doc-1', JAKUB), 'yes')
    assert.equal(drive.urls.length, 2)
    assert.ok(drive.urls[0]?.includes('/files/doc-1/permissions'))
    assert.ok(drive.urls[0]?.includes('supportsAllDrives=true'))
    assert.ok(drive.urls[1]?.includes('pageToken=p2'))
  })

  it('counts the domain, anyone with the link and the shared drive’s roles, not reading or commenting', async () => {
    let answer = async (grant: Record<string, unknown>) =>
      permissions(listing({ permissions: [grant] }).fetch).canEdit('doc-1', JAKUB)

    assert.equal(
      await answer({ domain: 'vednemesicnik.test', role: 'writer', type: 'domain' }),
      'yes',
    )
    assert.equal(await answer({ domain: 'external.test', role: 'writer', type: 'domain' }), 'no')
    /* A personal Google account can carry an address on the domain; Drive's grant is the
       Workspace's, so only the token's `hd` counts. */
    let personal = await permissions(
      listing({ permissions: [{ domain: 'vednemesicnik.test', role: 'writer', type: 'domain' }] })
        .fetch,
    ).canEdit('doc-1', { email: JAKUB_ADDRESS, hostedDomain: null })
    assert.equal(personal, 'no')
    assert.equal(await answer({ role: 'writer', type: 'anyone' }), 'yes')
    assert.equal(
      await answer({ emailAddress: JAKUB_ADDRESS, role: 'fileOrganizer', type: 'user' }),
      'yes',
    )
    assert.equal(
      await answer({ emailAddress: JAKUB_ADDRESS, role: 'organizer', type: 'user' }),
      'yes',
    )
    assert.equal(
      await answer({ emailAddress: JAKUB_ADDRESS, role: 'commenter', type: 'user' }),
      'no',
    )
    assert.equal(await answer({ emailAddress: JAKUB_ADDRESS, role: 'reader', type: 'user' }), 'no')
  })

  it('asks the membership service about an editing group, and a group it cannot answer for is a "don’t know"', async () => {
    let group = { emailAddress: 'korektori@vednemesicnik.test', role: 'writer', type: 'group' }
    let ask = (answer: MembershipAnswer, extra: unknown[] = []) =>
      permissions(
        listing({ permissions: [group, ...extra] }).fetch,
        membership({ 'korektori@vednemesicnik.test': answer }),
      ).canEdit('doc-1', JAKUB)

    assert.equal(await ask({ displayName: null, groupName: null, status: 'member' }), 'yes')
    assert.equal(await ask({ groupName: null, status: 'not-member' }), 'no')
    assert.equal(await ask({ status: 'unavailable' }), 'unavailable')
    assert.equal(await ask({ status: 'unknown-group' }), 'unavailable')
    assert.equal(await ask({ status: 'unavailable' }, [{ role: 'writer', type: 'anyone' }]), 'yes')
  })

  it('says no for a Doc the app’s account cannot see, and does not know when Drive fails', async (t) => {
    t.mock.method(console, 'error', () => {})
    let status = (code: number) =>
      permissions(async () => Response.json({ error: { message: 'x' } }, { status: code })).canEdit(
        'doc-1',
        JAKUB,
      )

    assert.equal(await status(404), 'no')
    assert.equal(await status(403), 'no')
    assert.equal(await status(500), 'unavailable')
    let unreachable = permissions(async () => {
      throw new TypeError('fetch failed')
    })
    assert.equal(await unreachable.canEdit('doc-1', JAKUB), 'unavailable')
  })
})
