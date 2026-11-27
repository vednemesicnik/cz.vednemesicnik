import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { isProduction, scriptTokenAudiences, sessionSecrets } from './environment.server.ts'

describe('isProduction', () => {
  it('is production unless NODE_ENV names development or test', () => {
    assert.equal(isProduction({ NODE_ENV: 'production' }), true)
    assert.equal(isProduction({}), true)
    assert.equal(isProduction({ NODE_ENV: '' }), true)
    assert.equal(isProduction({ NODE_ENV: 'staging' }), true)
    assert.equal(isProduction({ NODE_ENV: 'development' }), false)
    assert.equal(isProduction({ NODE_ENV: 'test' }), false)
  })

  it('refuses the development fallbacks when NODE_ENV is missing', () => {
    assert.throws(() => sessionSecrets({}), {
      message: 'Chybí povinná proměnná prostředí SESSION_SECRET.',
    })
    assert.throws(() => scriptTokenAudiences({}), {
      message: 'Chybí povinná proměnná prostředí SCRIPT_TOKEN_AUDIENCE.',
    })
  })

  it('keeps the development fallbacks when NODE_ENV asks for them', () => {
    assert.deepEqual(sessionSecrets({ NODE_ENV: 'development' }), [
      'development-only-session-secret',
    ])
    assert.equal(scriptTokenAudiences({ NODE_ENV: 'test' }), 'any')
  })
})
