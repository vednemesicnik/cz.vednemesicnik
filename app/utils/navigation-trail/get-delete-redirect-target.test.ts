import { describe, expect, test } from 'vitest'

import { getDeleteRedirectTarget } from './get-delete-redirect-target'

const listPath = '/administration/articles'

const withTarget = (target?: string) => {
  const formData = new FormData()

  if (target !== undefined) formData.append('redirectTo', target)

  return formData
}

describe('getDeleteRedirectTarget', () => {
  test('goes back to the list as it was left', () => {
    expect(
      getDeleteRedirectTarget(
        withTarget('/administration/articles?q=ples&state=pending&page=2'),
        listPath,
      ),
    ).toBe('/administration/articles?q=ples&state=pending&page=2')
  })

  test('goes to the bare list without a target', () => {
    expect(getDeleteRedirectTarget(withTarget(), listPath)).toBe(listPath)
    expect(getDeleteRedirectTarget(withTarget(listPath), listPath)).toBe(
      listPath,
    )
  })

  test('takes no address of another list or another site', () => {
    for (const target of [
      '/administration/articles/categories?q=a',
      '/administration/articlesx?q=a',
      'https://example.com/administration/articles?q=a',
      '//example.com',
      '/administration/articles?q=a b',
      '/administration/articles?q=\\a',
    ]) {
      expect(getDeleteRedirectTarget(withTarget(target), listPath)).toBe(
        listPath,
      )
    }
  })
})
