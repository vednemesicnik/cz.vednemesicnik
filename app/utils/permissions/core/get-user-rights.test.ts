import { describe, expect, test } from 'vitest'

import { getUserRights } from './get-user-rights'

describe('getUserRights', () => {
  test("grants 'any' when a matching row has access 'any'", () => {
    const permissions = [
      { access: 'any', action: 'update', entity: 'author' },
      { access: 'own', action: 'delete', entity: 'user' },
    ]

    const { hasOwn, hasAny } = getUserRights(permissions, {
      action: 'update',
      entity: 'author',
    })

    expect(hasAny).toBe(true)
    expect(hasOwn).toBe(false)
  })

  test("grants 'own' only when ownId === targetId", () => {
    const permissions = [{ access: 'own', action: 'update', entity: 'user' }]

    const matching = getUserRights(permissions, {
      action: 'update',
      entity: 'user',
      ownId: 'user-1',
      targetId: 'user-1',
    })
    expect(matching.hasOwn).toBe(true)

    const nonMatching = getUserRights(permissions, {
      action: 'update',
      entity: 'user',
      ownId: 'user-1',
      targetId: 'user-2',
    })
    expect(nonMatching.hasOwn).toBe(false)
  })

  test("'own' is denied when targetId is missing", () => {
    const permissions = [{ access: 'own', action: 'update', entity: 'user' }]

    const { hasOwn } = getUserRights(permissions, {
      action: 'update',
      entity: 'user',
      ownId: 'user-1',
    })

    expect(hasOwn).toBe(false)
  })

  test("'any' is independent of ownId / targetId", () => {
    const permissions = [{ access: 'any', action: 'view', entity: 'user' }]

    const { hasAny } = getUserRights(permissions, {
      action: 'view',
      entity: 'user',
    })

    expect(hasAny).toBe(true)
  })

  test('returns no rights for an empty permissions array', () => {
    const { hasOwn, hasAny } = getUserRights([], {
      action: 'update',
      entity: 'user',
      ownId: 'user-1',
      targetId: 'user-1',
    })

    expect(hasOwn).toBe(false)
    expect(hasAny).toBe(false)
  })

  test('does not match a different action or entity', () => {
    const permissions = [{ access: 'any', action: 'update', entity: 'author' }]

    const { hasAny: wrongAction } = getUserRights(permissions, {
      action: 'delete',
      entity: 'author',
    })
    expect(wrongAction).toBe(false)

    const { hasAny: wrongEntity } = getUserRights(permissions, {
      action: 'update',
      entity: 'user',
    })
    expect(wrongEntity).toBe(false)
  })
})
