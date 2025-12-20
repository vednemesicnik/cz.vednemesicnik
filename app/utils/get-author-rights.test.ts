import { describe, expect, test } from 'vitest'

import { getAuthorRights } from './get-author-rights'

describe('getAuthorRights', () => {
  test("should return true for matching permissions with 'article' entity", () => {
    const permissions = [
      { access: 'any', action: 'update', entity: 'article', state: 'draft' },
      { access: 'own', action: 'delete', entity: 'issue', state: 'published' },
    ]

    const options = {
      access: ['any'],
      actions: ['update'],
      entities: ['article'],
      states: ['draft'],
    }

    const [[[[hasArticleUpdateAnyDraftRight]]]] = getAuthorRights(
      permissions,
      options,
    )

    expect(hasArticleUpdateAnyDraftRight).toEqual(true)
  })

  test("should return false for non-matching permissions with 'issue' entity", () => {
    const permissions = [
      { access: 'any', action: 'update', entity: 'article', state: 'draft' },
    ]

    const options = {
      access: ['own'],
      actions: ['delete'],
      entities: ['issue'],
      states: ['published'],
    }

    const [[[[hasIssueDeleteOwnPublishedRight]]]] = getAuthorRights(
      permissions,
      options,
    )

    expect(hasIssueDeleteOwnPublishedRight).toEqual(false)
  })

  test('should handle no options and return true if any permission matches', () => {
    const permissions = [
      { access: 'any', action: 'update', entity: 'article', state: 'draft' },
      { access: 'own', action: 'delete', entity: 'issue', state: 'published' },
    ]

    const [[[[hasRight]]]] = getAuthorRights(permissions)

    expect(hasRight).toEqual(true)
  })

  test('should return true for own access with matching ids', () => {
    const permissions = [
      { access: 'own', action: 'update', entity: 'article', state: 'draft' },
    ]

    const options = {
      access: ['own'],
      actions: ['update'],
      entities: ['article'],
      ownId: '123',
      states: ['draft'],
      targetId: '123',
    }

    const [[[[hasArticleUpdateOwnDraftRight]]]] = getAuthorRights(
      permissions,
      options,
    )

    expect(hasArticleUpdateOwnDraftRight).toEqual(true)
  })

  test('should return false for own access with non-matching ids', () => {
    const permissions = [
      { access: 'own', action: 'update', entity: 'article', state: 'draft' },
    ]

    const options = {
      access: ['own'],
      actions: ['update'],
      entities: ['article'],
      ownId: '123',
      states: ['draft'],
      targetId: '456',
    }

    const [[[[hasArticleUpdateOwnDraftRight]]]] = getAuthorRights(
      permissions,
      options,
    )

    expect(hasArticleUpdateOwnDraftRight).toEqual(false)
  })
})
