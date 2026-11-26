import { describe, expect, test } from 'vitest'

import { getAuthorRights } from './get-author-rights'

describe('getAuthorRights', () => {
  test("grants 'any' when a matching row has access 'any'", () => {
    const permissions = [
      { access: 'any', action: 'view', entity: 'article', state: 'published' },
    ]

    const { hasOwn, hasAny } = getAuthorRights(permissions, {
      action: 'view',
      entity: 'article',
      state: 'published',
    })

    expect(hasAny).toBe(true)
    expect(hasOwn).toBe(false)
  })

  describe('state dimension', () => {
    const permissions = [
      { access: 'any', action: 'update', entity: 'article', state: 'draft' },
    ]

    test('matches when state matches', () => {
      const { hasAny } = getAuthorRights(permissions, {
        action: 'update',
        entity: 'article',
        state: 'draft',
      })
      expect(hasAny).toBe(true)
    })

    test('does not match when state mismatches', () => {
      const { hasAny } = getAuthorRights(permissions, {
        action: 'update',
        entity: 'article',
        state: 'published',
      })
      expect(hasAny).toBe(false)
    })

    test('omitted state matches any state', () => {
      const { hasAny } = getAuthorRights(permissions, {
        action: 'update',
        entity: 'article',
      })
      expect(hasAny).toBe(true)
    })
  })

  test("grants 'own' when the current author is one of the targets", () => {
    const permissions = [
      { access: 'own', action: 'update', entity: 'article', state: 'draft' },
    ]

    const owned = getAuthorRights(permissions, {
      action: 'update',
      entity: 'article',
      ownId: 'author-1',
      state: 'draft',
      targetAuthorIds: ['author-2', 'author-1'],
    })
    expect(owned.hasOwn).toBe(true)

    const notOwned = getAuthorRights(permissions, {
      action: 'update',
      entity: 'article',
      ownId: 'author-1',
      state: 'draft',
      targetAuthorIds: ['author-2', 'author-3'],
    })
    expect(notOwned.hasOwn).toBe(false)
  })

  test("'own' is denied for an empty or missing target list", () => {
    const permissions = [
      { access: 'own', action: 'update', entity: 'article', state: 'draft' },
    ]

    const emptyTargets = getAuthorRights(permissions, {
      action: 'update',
      entity: 'article',
      ownId: 'author-1',
      state: 'draft',
      targetAuthorIds: [],
    })
    expect(emptyTargets.hasOwn).toBe(false)

    const missingTargets = getAuthorRights(permissions, {
      action: 'update',
      entity: 'article',
      ownId: 'author-1',
      state: 'draft',
    })
    expect(missingTargets.hasOwn).toBe(false)
  })

  test("'any' is independent of ownId / targetAuthorIds", () => {
    const permissions = [
      { access: 'any', action: 'view', entity: 'article', state: 'draft' },
    ]

    const { hasAny } = getAuthorRights(permissions, {
      action: 'view',
      entity: 'article',
      state: 'draft',
    })

    expect(hasAny).toBe(true)
  })

  test('returns no rights for an empty permissions array', () => {
    const { hasOwn, hasAny } = getAuthorRights([], {
      action: 'update',
      entity: 'article',
      ownId: 'author-1',
      state: 'draft',
      targetAuthorIds: ['author-1'],
    })

    expect(hasOwn).toBe(false)
    expect(hasAny).toBe(false)
  })
})
