import { describe, expect, test } from 'vitest'

import { isWebHost } from './is-web-host.ts'

describe('isWebHost', () => {
  test.each([
    'vednemesicnik.cz',
    'www.vednemesicnik.cz',
    'cz-vednemesicnik.fly.dev',
    'localhost',
    '127.0.0.1',
    '[::1]',
    'member.localhost',
  ])('answers %s', (hostname) => {
    expect(isWebHost(hostname)).toBe(true)
  })

  test.each([
    'publikace.vednemesicnik.cz',
    'publikace.localhost',
    'other-app.fly.dev',
    'unknown.test',
    'localhost.unknown.test',
  ])('refuses %s', (hostname) => {
    expect(isWebHost(hostname)).toBe(false)
  })
})
