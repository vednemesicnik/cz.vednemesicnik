import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { AUTHORIZATION_TTL_MS, storedPerson, UNSETTLED_RETRY_MS } from './session.server.ts'

describe('storedPerson', () => {
  it('trusts a settled answer for ten minutes and asks again after one when a service was silent', () => {
    let decision = {
      displayName: 'Marie Horáková',
      email: 'marie@vednemesicnik.test',
      roles: { isEditor: true, isProofreader: false },
    }
    let before = Date.now()
    let settled = storedPerson({ ...decision, isSettled: true })
    let unsettled = storedPerson({ ...decision, isSettled: false })
    let after = Date.now()

    assert.ok(settled.authorizedUntil >= before + AUTHORIZATION_TTL_MS)
    assert.ok(settled.authorizedUntil <= after + AUTHORIZATION_TTL_MS)
    assert.ok(unsettled.authorizedUntil >= before + UNSETTLED_RETRY_MS)
    assert.ok(unsettled.authorizedUntil <= after + UNSETTLED_RETRY_MS)
    assert.deepEqual(
      { isEditor: unsettled.isEditor, isProofreader: unsettled.isProofreader },
      { isEditor: true, isProofreader: false },
    )
  })
})
