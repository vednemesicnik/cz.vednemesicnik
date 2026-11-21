import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { createTestApp, TEST_DOMAIN } from '../test-app.server.ts'
import { decideAccess, type VerifiedProfile } from './access.server.ts'
import type { MembershipAnswer, MembershipCheck } from './group-membership.server.ts'

function profile(email: string, overrides: Partial<VerifiedProfile> = {}): VerifiedProfile {
  return { email, emailVerified: true, hostedDomain: TEST_DOMAIN, name: 'Eva Malá', ...overrides }
}

const NO_ADDRESS = async () => null
const EDITOR_ONLY = { isEditor: true, isProofreader: false }
const PROOFREADERS = 'korektura@vednemesicnik.test'

/** A service that answers the same for every group, counting how often it was asked. */
function service(answer: MembershipAnswer) {
  let calls = 0
  let check: MembershipCheck = async () => {
    calls += 1
    return answer
  }
  return { calls: () => calls, check }
}

describe('decideAccess', () => {
  it('refuses an account off the domain, unverified, or from a personal Google account', async () => {
    let app = await createTestApp()
    try {
      let context = {
        checkMembership: service({ groupName: null, status: 'not-member' }).check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: NO_ADDRESS,
      }

      for (let candidate of [
        profile('eva@external.test', { hostedDomain: 'external.test' }),
        profile('eva@vednemesicnik.test', { emailVerified: false }),
        profile('eva@vednemesicnik.test', { hostedDomain: null }),
      ]) {
        assert.deepEqual(await decideAccess(candidate, context), {
          allowed: false,
          email: candidate.email,
          reason: 'domain',
        })
      }
      assert.equal(
        (await decideAccess(profile('eva@vednemesicnik.test'), { ...context, domain: '' })).allowed,
        false,
      )
    } finally {
      await app.close()
    }
  })

  it('lets a named account in without asking the service, even when it is down', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('eva@vednemesicnik.test', now())
      let down = service({ status: 'unavailable' })

      let decision = await decideAccess(profile('Eva@Vednemesicnik.test'), {
        checkMembership: down.check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: NO_ADDRESS,
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Eva Malá',
        email: 'eva@vednemesicnik.test',
        isSettled: true,
        roles: EDITOR_ONLY,
      })
      assert.equal(down.calls(), 0)
    } finally {
      await app.close()
    }
  })

  it('lets a member of a listed group in, under the name the service gives', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        now(),
      )

      let decision = await decideAccess(profile('jan@vednemesicnik.test', { name: null }), {
        checkMembership: service({ displayName: 'Jan Novák', groupName: null, status: 'member' })
          .check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: NO_ADDRESS,
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Jan Novák',
        email: 'jan@vednemesicnik.test',
        isSettled: true,
        roles: EDITOR_ONLY,
      })
    } finally {
      await app.close()
    }
  })

  it('says notlisted only when every group answered no, and unavailable when one could not', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        now(),
      )
      let context = (answer: MembershipAnswer) => ({
        checkMembership: service(answer).check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: NO_ADDRESS,
      })

      let no = await decideAccess(
        profile('jan@vednemesicnik.test'),
        context({ groupName: null, status: 'not-member' }),
      )
      let down = await decideAccess(
        profile('jan@vednemesicnik.test'),
        context({ status: 'unavailable' }),
      )
      let unknown = await decideAccess(
        profile('jan@vednemesicnik.test'),
        context({ status: 'unknown-group' }),
      )

      assert.deepEqual(no, { allowed: false, email: 'jan@vednemesicnik.test', reason: 'notlisted' })
      assert.deepEqual(down, {
        allowed: false,
        email: 'jan@vednemesicnik.test',
        reason: 'unavailable',
      })
      assert.deepEqual(unknown, {
        allowed: false,
        email: 'jan@vednemesicnik.test',
        reason: 'unavailable',
      })
    } finally {
      await app.close()
    }
  })

  it('makes the proofreaders’ address itself a proofreader, without asking the service', async () => {
    let app = await createTestApp()
    try {
      let down = service({ status: 'unavailable' })
      let decision = await decideAccess(profile('Korektura@vednemesicnik.test'), {
        checkMembership: down.check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: async () => PROOFREADERS,
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Eva Malá',
        email: PROOFREADERS,
        isSettled: true,
        roles: { isEditor: false, isProofreader: true },
      })
      assert.equal(down.calls(), 0)
    } finally {
      await app.close()
    }
  })

  it('makes a member of the proofreaders’ group a proofreader, and an editor-in-chief both', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      let member = service({ displayName: 'Lenka Svobodová', groupName: null, status: 'member' })
      let context = {
        checkMembership: member.check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: async () => PROOFREADERS,
      }

      let lenka = await decideAccess(profile('lenka@vednemesicnik.test', { name: null }), context)
      let marie = await decideAccess(profile('marie@vednemesicnik.test'), context)

      assert.deepEqual(lenka, {
        allowed: true,
        displayName: 'Lenka Svobodová',
        email: 'lenka@vednemesicnik.test',
        isSettled: true,
        roles: { isEditor: false, isProofreader: true },
      })
      assert.deepEqual(marie.allowed && marie.roles, { isEditor: true, isProofreader: true })
    } finally {
      await app.close()
    }
  })

  it('takes a service that does not know the address for a no, and one that is down for a “don’t know”', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      let context = (answer: MembershipAnswer) => ({
        checkMembership: service(answer).check,
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: async () => PROOFREADERS,
      })

      assert.deepEqual(
        await decideAccess(profile('jan@vednemesicnik.test'), context({ status: 'unknown-group' })),
        { allowed: false, email: 'jan@vednemesicnik.test', reason: 'notlisted' },
      )
      assert.deepEqual(
        await decideAccess(profile('jan@vednemesicnik.test'), context({ status: 'unavailable' })),
        { allowed: false, email: 'jan@vednemesicnik.test', reason: 'unavailable' },
      )
      /* A named editor-in-chief stays in, without the role the service could not confirm, and the
         answer is not to be kept. */
      assert.deepEqual(
        await decideAccess(profile('marie@vednemesicnik.test'), context({ status: 'unavailable' })),
        {
          allowed: true,
          displayName: 'Eva Malá',
          email: 'marie@vednemesicnik.test',
          isSettled: false,
          roles: EDITOR_ONLY,
        },
      )
    } finally {
      await app.close()
    }
  })

  it('settles a proofreader’s decision beside a listed group the service does not know', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        now(),
      )
      let decision = await decideAccess(profile('lenka@vednemesicnik.test'), {
        checkMembership: async (_email, group) =>
          group === PROOFREADERS
            ? { displayName: null, groupName: null, status: 'member' }
            : { status: 'unknown-group' },
        directory: app.directory,
        domain: TEST_DOMAIN,
        proofreadersAddress: async () => PROOFREADERS,
      })

      assert.deepEqual(decision.allowed && decision.isSettled, true)
    } finally {
      await app.close()
    }
  })
})
