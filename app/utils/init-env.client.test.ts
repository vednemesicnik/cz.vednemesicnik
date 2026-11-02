// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'

import { ENV_META_NAME } from '~/config/env-meta-config'

import { initEnvClient } from './init-env.client'

const environment: typeof ENV = {
  BASE_URL: 'https://canonical.local.dev/</script><script>alert(1)//',
  MODE: 'production',
  SENTRY_DSN: 'https://public@ingest.local.dev/1',
}

const renderMeta = (content: string) => {
  const meta = document.createElement('meta')
  meta.name = ENV_META_NAME
  meta.content = content
  document.head.append(meta)
}

describe('initEnvClient', () => {
  afterEach(() => {
    document.head.replaceChildren()
    Reflect.deleteProperty(window, 'ENV')
  })

  it('sets window.ENV from the meta tag', () => {
    renderMeta(JSON.stringify(environment))

    initEnvClient()

    expect(window.ENV).toEqual(environment)
  })

  it('serialises back to the same content, as hydration does', () => {
    const content = JSON.stringify({ ...environment, SENTRY_DSN: undefined })
    renderMeta(content)

    initEnvClient()

    expect(JSON.stringify(window.ENV)).toBe(content)
  })

  it('throws when the meta tag is missing', () => {
    expect(() => initEnvClient()).toThrow(ENV_META_NAME)
    expect(window.ENV).toBeUndefined()
  })
})
