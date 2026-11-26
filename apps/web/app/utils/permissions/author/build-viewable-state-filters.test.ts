import { describe, expect, it } from 'vitest'

import { buildViewableStateFilters } from './build-viewable-state-filters'

const ownFilter = { authorId: 'author-1' }

describe('buildViewableStateFilters', () => {
  it('omits a state the role cannot view (no leak of others’ rows)', () => {
    const result = buildViewableStateFilters(
      [
        { rights: { hasAny: false, hasOwn: true }, state: 'draft' },
        { rights: { hasAny: false, hasOwn: true }, state: 'published' },
        { rights: { hasAny: false, hasOwn: false }, state: 'archived' },
      ],
      ownFilter,
    )

    expect(result).toEqual([
      { authorId: 'author-1', state: 'draft' },
      { authorId: 'author-1', state: 'published' },
    ])
  })

  it('scopes an own-only state to the viewer', () => {
    const result = buildViewableStateFilters(
      [{ rights: { hasAny: false, hasOwn: true }, state: 'archived' }],
      ownFilter,
    )

    expect(result).toEqual([{ authorId: 'author-1', state: 'archived' }])
  })

  it('leaves an `any` state unscoped', () => {
    const result = buildViewableStateFilters(
      [{ rights: { hasAny: true, hasOwn: false }, state: 'draft' }],
      ownFilter,
    )

    expect(result).toEqual([{ state: 'draft' }])
  })

  it('treats `any` as unscoped even when `own` is also present', () => {
    const result = buildViewableStateFilters(
      [{ rights: { hasAny: true, hasOwn: true }, state: 'draft' }],
      ownFilter,
    )

    expect(result).toEqual([{ state: 'draft' }])
  })

  it('returns an empty array when no state is viewable', () => {
    const result = buildViewableStateFilters(
      [
        { rights: { hasAny: false, hasOwn: false }, state: 'draft' },
        { rights: { hasAny: false, hasOwn: false }, state: 'archived' },
      ],
      ownFilter,
    )

    expect(result).toEqual([])
  })

  it('supports a relational own-filter (articles)', () => {
    const result = buildViewableStateFilters(
      [{ rights: { hasAny: false, hasOwn: true }, state: 'archived' }],
      { authors: { some: { id: 'author-1' } } },
    )

    expect(result).toEqual([
      { authors: { some: { id: 'author-1' } }, state: 'archived' },
    ])
  })
})
