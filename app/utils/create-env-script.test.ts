import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

import { createEnvScript } from './create-env-script'

const environment: typeof ENV = {
  BASE_URL: 'https://canonical.local.dev',
  MODE: 'production',
  SENTRY_DSN: 'https://public@ingest.local.dev/1',
}

const evaluate = (script: string) => {
  const window: { ENV?: typeof ENV } = {}
  runInNewContext(script, { window })

  // From the context's realm into this one, for toEqual.
  return JSON.parse(JSON.stringify(window.ENV)) as typeof ENV
}

describe('createEnvScript', () => {
  it('sets window.ENV to the given values', () => {
    expect(evaluate(createEnvScript(environment))).toEqual(environment)
  })

  it('leaves out a value that is not set', () => {
    const script = createEnvScript({ ...environment, SENTRY_DSN: undefined })

    expect(evaluate(script)).not.toHaveProperty('SENTRY_DSN')
  })

  it('cannot close the script element, and the value survives', () => {
    const baseUrl = 'https://canonical.local.dev/</script><script>alert(1)//'
    const script = createEnvScript({ ...environment, BASE_URL: baseUrl })

    expect(script).not.toContain('<')
    expect(evaluate(script).BASE_URL).toBe(baseUrl)
  })

  it('renders the same again from what it set, as hydration does', () => {
    const script = createEnvScript(environment)

    expect(createEnvScript(evaluate(script))).toBe(script)
  })
})
