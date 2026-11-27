import { describe, expect, test } from 'vitest'

import { isPublikaceHost } from './is-publikace-host.ts'

describe('isPublikaceHost', () => {
  test.each(['publikace.vednemesicnik.cz', 'publikace.localhost'])(
    'answers %s',
    (hostname) => {
      expect(isPublikaceHost(hostname)).toBe(true)
    },
  )

  test.each([
    'vednemesicnik.cz',
    'cz-vednemesicnik.fly.dev',
    'localhost',
    'member.localhost',
    'publikace.vednemesicnik.cz.unknown.test',
  ])('refuses %s', (hostname) => {
    expect(isPublikaceHost(hostname)).toBe(false)
  })
})
