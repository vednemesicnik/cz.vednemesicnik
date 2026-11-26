import { describe, expect, test } from 'vitest'

import { isAssociationAuthor } from './is-association-author'

describe('isAssociationAuthor', () => {
  test("is the author of the Owner's account", () => {
    expect(isAssociationAuthor({ user: { role: { name: 'owner' } } })).toBe(
      true,
    )
  })

  test("is no other account's author", () => {
    expect(
      isAssociationAuthor({ user: { role: { name: 'administrator' } } }),
    ).toBe(false)
  })

  test('is no author without an account', () => {
    expect(isAssociationAuthor({ user: null })).toBe(false)
  })
})
