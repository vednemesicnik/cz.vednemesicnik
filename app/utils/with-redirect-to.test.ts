import { describe, expect, test } from 'vitest'

import { withRedirectTo } from '~/utils/with-redirect-to'

describe('withRedirectTo', () => {
  test('appends a non-default target', () => {
    expect(
      withRedirectTo('/administration/sign-in', '/administration/articles'),
    ).toBe('/administration/sign-in?redirectTo=%2Fadministration%2Farticles')
  })

  test('keeps the query string of the target encoded', () => {
    expect(
      withRedirectTo('/administration/sign-in', '/administration?page=2&q=a'),
    ).toBe(
      '/administration/sign-in?redirectTo=%2Fadministration%3Fpage%3D2%26q%3Da',
    )
  })

  test('leaves the path alone for the default target', () => {
    expect(withRedirectTo('/administration/sign-in', '/administration')).toBe(
      '/administration/sign-in',
    )
  })

  test('drops an unsafe target', () => {
    expect(withRedirectTo('/administration/sign-in', '//evil.com')).toBe(
      '/administration/sign-in',
    )
  })
})
