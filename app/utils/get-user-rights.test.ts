import { describe, expect, test } from 'vitest'

import { getUserRights } from './get-user-rights'

describe('getUserRights', () => {
  test("should return true for matching permissions with 'author' entity", () => {
    const permissions = [
      { access: 'any', action: 'update', entity: 'author' },
      { access: 'own', action: 'delete', entity: 'user' },
    ]

    const options = {
      access: ['any'],
      actions: ['update'],
      entities: ['author'],
    }

    const [[[hasAuthorUpdateAnyRight]]] = getUserRights(permissions, options)

    expect(hasAuthorUpdateAnyRight).toEqual(true)
  })

  test("should return false for non-matching permissions with 'user' entity", () => {
    const permissions = [{ access: 'any', action: 'update', entity: 'author' }]

    const options = {
      access: ['own'],
      actions: ['delete'],
      entities: ['user'],
    }

    const [[[hasUserDeleteOwnRight]]] = getUserRights(permissions, options)

    expect(hasUserDeleteOwnRight).toEqual(false)
  })

  test('should handle no options when permissions filtered by database query', () => {
    const permissions = [{ access: 'any', action: 'update', entity: 'author' }]

    const [[[hasRight]]] = getUserRights(permissions)

    expect(hasRight).toEqual(true)
  })
})
