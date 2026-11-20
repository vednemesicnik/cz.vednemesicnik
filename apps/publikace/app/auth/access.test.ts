import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { createTestApp, TEST_DOMAIN } from '../test-app.server.ts'
import { decideAccess, type VerifiedProfile } from './access.server.ts'
import type { MembershipAnswer, MembershipCheck } from './group-membership.server.ts'

function profile(email: string, overrides: Partial<VerifiedProfile> = {}): VerifiedProfile {
  return { email, emailVerified: true, hostedDomain: TEST_DOMAIN, name: 'Eva Malá', ...overrides }
}

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
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Eva Malá',
        email: 'eva@vednemesicnik.test',
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
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Jan Novák',
        email: 'jan@vednemesicnik.test',
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
})
