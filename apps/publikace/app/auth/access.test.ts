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
        checkMembership: service({ status: 'not-member' }).check,
        directory: app.directory,
        domain: TEST_DOMAIN,
      }

      for (let candidate of [
        profile('eva@jinde.cz', { hostedDomain: 'jinde.cz' }),
        profile('eva@priklad.cz', { emailVerified: false }),
        profile('eva@priklad.cz', { hostedDomain: null }),
      ]) {
        assert.deepEqual(await decideAccess(candidate, context), {
          allowed: false,
          email: candidate.email,
          reason: 'domain',
        })
      }
      assert.equal(
        (await decideAccess(profile('eva@priklad.cz'), { ...context, domain: '' })).allowed,
        false,
      )
    } finally {
      await app.close()
    }
  })

  it('lets a named account in without asking the service, even when it is down', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('eva@priklad.cz', now())
      let down = service({ status: 'unavailable' })

      let decision = await decideAccess(profile('Eva@Priklad.cz'), {
        checkMembership: down.check,
        directory: app.directory,
        domain: TEST_DOMAIN,
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Eva Malá',
        email: 'eva@priklad.cz',
      })
      assert.equal(down.calls(), 0)
    } finally {
      await app.close()
    }
  })

  it('lets a member of a listed group in, under the name the service gives', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@priklad.cz', now())
      await app.directory.addGroup('marie@priklad.cz', 'vybor@priklad.cz', now())

      let decision = await decideAccess(profile('jan@priklad.cz', { name: null }), {
        checkMembership: service({ displayName: 'Jan Novák', status: 'member' }).check,
        directory: app.directory,
        domain: TEST_DOMAIN,
      })

      assert.deepEqual(decision, {
        allowed: true,
        displayName: 'Jan Novák',
        email: 'jan@priklad.cz',
      })
    } finally {
      await app.close()
    }
  })

  it('says notlisted only when every group answered no, and unavailable when one could not', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@priklad.cz', now())
      await app.directory.addGroup('marie@priklad.cz', 'vybor@priklad.cz', now())
      let context = (answer: MembershipAnswer) => ({
        checkMembership: service(answer).check,
        directory: app.directory,
        domain: TEST_DOMAIN,
      })

      let no = await decideAccess(profile('jan@priklad.cz'), context({ status: 'not-member' }))
      let down = await decideAccess(profile('jan@priklad.cz'), context({ status: 'unavailable' }))
      let unknown = await decideAccess(
        profile('jan@priklad.cz'),
        context({ status: 'unknown-group' }),
      )

      assert.deepEqual(no, { allowed: false, email: 'jan@priklad.cz', reason: 'notlisted' })
      assert.deepEqual(down, { allowed: false, email: 'jan@priklad.cz', reason: 'unavailable' })
      assert.deepEqual(unknown, { allowed: false, email: 'jan@priklad.cz', reason: 'unavailable' })
    } finally {
      await app.close()
    }
  })
})
