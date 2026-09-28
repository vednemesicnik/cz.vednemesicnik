import { describe, expect, test } from 'vitest'

import { buildWebVisibleWhere } from './build-web-visible-where'

const ownFilter = { authorId: 'author-1' }

describe('buildWebVisibleWhere', () => {
  test('shows an anonymous visitor only published content', () => {
    expect(buildWebVisibleWhere(null)).toEqual({
      OR: [{ state: 'published' }],
    })
  })

  test('adds only own drafts for own access', () => {
    expect(
      buildWebVisibleWhere({
        ownFilter,
        stateRights: [
          { rights: { hasAny: false, hasOwn: true }, state: 'draft' },
        ],
      }),
    ).toEqual({
      OR: [{ state: 'published' }, { authorId: 'author-1', state: 'draft' }],
    })
  })

  test('adds every draft for any access', () => {
    expect(
      buildWebVisibleWhere({
        ownFilter,
        stateRights: [
          { rights: { hasAny: true, hasOwn: true }, state: 'draft' },
        ],
      }),
    ).toEqual({ OR: [{ state: 'published' }, { state: 'draft' }] })
  })

  test('adds nothing for a state without a view right', () => {
    expect(
      buildWebVisibleWhere({
        ownFilter,
        stateRights: [
          { rights: { hasAny: true, hasOwn: true }, state: 'draft' },
          { rights: { hasAny: false, hasOwn: false }, state: 'archived' },
        ],
      }),
    ).toEqual({ OR: [{ state: 'published' }, { state: 'draft' }] })
  })
})
