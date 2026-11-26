import { describe, expect, test } from 'vitest'

import { createMagicLinkUrl } from './create-magic-link-url'

const baseUrl = 'https://priklad.cz'

describe('createMagicLinkUrl', () => {
  test('carries the token and the e-mail to the confirmation page', () => {
    const link = new URL(
      createMagicLinkUrl({
        baseUrl,
        email: 'jakub.novak@priklad.cz',
        redirectTo: '/administration',
        token: 'abc',
      }),
    )

    expect(link.origin).toBe(baseUrl)
    expect(link.pathname).toBe('/administration/sign-in/magic-link/verify')
    expect(link.searchParams.get('token')).toBe('abc')
    expect(link.searchParams.get('email')).toBe('jakub.novak@priklad.cz')
    expect(link.searchParams.has('redirectTo')).toBe(false)
  })

  test('carries a non-default landing page', () => {
    const link = new URL(
      createMagicLinkUrl({
        baseUrl,
        email: 'jakub.novak@priklad.cz',
        redirectTo: '/administration/settings',
        token: 'abc',
      }),
    )

    expect(link.searchParams.get('redirectTo')).toBe('/administration/settings')
  })

  test('drops a landing page on another origin', () => {
    const link = new URL(
      createMagicLinkUrl({
        baseUrl,
        email: 'jakub.novak@priklad.cz',
        redirectTo: '//evil.priklad.cz',
        token: 'abc',
      }),
    )

    expect(link.searchParams.has('redirectTo')).toBe(false)
  })
})
