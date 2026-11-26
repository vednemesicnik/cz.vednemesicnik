import { afterEach, describe, expect, test, vi } from 'vitest'

import { toAbsoluteUrl } from './to-absolute-url.server'

describe('toAbsoluteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('resolves a path against BASE_URL', () => {
    vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')

    expect(toAbsoluteUrl('/feeds/articles.xml')).toBe(
      'https://vednemesicnik.cz/feeds/articles.xml',
    )
  })

  test('keeps a fragment', () => {
    vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')

    expect(toAbsoluteUrl('/feeds#podcast-kabinet')).toBe(
      'https://vednemesicnik.cz/feeds#podcast-kabinet',
    )
  })
})
