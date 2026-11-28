import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  isProduction,
  jobStartEndpoints,
  runningVersion,
  scriptTokenAudiences,
  sessionSecrets,
} from './environment.server.ts'

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

describe('jobStartEndpoints', () => {
  it('knows only the jobs with both variables, in production too', () => {
    assert.deepEqual(
      jobStartEndpoints({
        GAS_ARTWORK_REPLIES_SECRET: 's-1',
        GAS_ARTWORK_REPLIES_URL: 'https://script.test/replies/exec',
        GAS_PRINT_HANDOFF_URL: 'https://script.test/print/exec',
        GAS_PROOFREADING_DIGEST_SECRET: '',
        GAS_PROOFREADING_DIGEST_URL: 'https://script.test/digest/exec',
        NODE_ENV: 'production',
      }),
      { 'artwork-replies': { secret: 's-1', url: 'https://script.test/replies/exec' } },
    )
    assert.deepEqual(jobStartEndpoints({ NODE_ENV: 'production' }), {})
  })
})

describe('runningVersion', () => {
  it('is a development build outside production', () => {
    assert.deepEqual(runningVersion({ NODE_ENV: 'development', VERSION: 'publikace-v1.1.1' }), {
      kind: 'development',
    })
  })

  it('is the release the deploy named', () => {
    assert.deepEqual(
      runningVersion({ COMMIT: '7a62267', NODE_ENV: 'production', VERSION: 'publikace-v1.1.1' }),
      { kind: 'release', tag: 'publikace-v1.1.1', version: '1.1.1' },
    )
  })

  it('is the commit alone when no tag stands for it', () => {
    assert.deepEqual(runningVersion({ COMMIT: '7a62267', NODE_ENV: 'production', VERSION: '' }), {
      commit: '7a62267',
      kind: 'commit',
    })
  })

  it('takes a value of another shape for missing', () => {
    assert.equal(
      runningVersion({ COMMIT: 'main', NODE_ENV: 'production', VERSION: 'v1.1.1' }),
      null,
    )
  })
})
