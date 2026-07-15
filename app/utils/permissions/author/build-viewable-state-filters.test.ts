import { describe, expect, it } from 'vitest'

import { buildViewableStateFilters } from './build-viewable-state-filters'

const ownFilter = { authorId: 'author-1' }

describe('buildViewableStateFilters', () => {
  it('omits a state the role cannot view (no leak of others’ rows)', () => {
    const result = buildViewableStateFilters(
      [
        { state: 'draft', rights: { hasOwn: true, hasAny: false } },
        { state: 'published', rights: { hasOwn: true, hasAny: false } },
        { state: 'archived', rights: { hasOwn: false, hasAny: false } },
      ],
      ownFilter,
    )

    expect(result).toEqual([
      { state: 'draft', authorId: 'author-1' },
      { state: 'published', authorId: 'author-1' },
    ])
  })

  it('scopes an own-only state to the viewer', () => {
    const result = buildViewableStateFilters(
      [{ state: 'archived', rights: { hasOwn: true, hasAny: false } }],
      ownFilter,
    )

    expect(result).toEqual([{ state: 'archived', authorId: 'author-1' }])
  })

  it('leaves an `any` state unscoped', () => {
    const result = buildViewableStateFilters(
      [{ state: 'draft', rights: { hasOwn: false, hasAny: true } }],
      ownFilter,
    )

    expect(result).toEqual([{ state: 'draft' }])
  })

  it('treats `any` as unscoped even when `own` is also present', () => {
    const result = buildViewableStateFilters(
      [{ state: 'draft', rights: { hasOwn: true, hasAny: true } }],
      ownFilter,
    )

    expect(result).toEqual([{ state: 'draft' }])
  })

  it('returns an empty array when no state is viewable', () => {
    const result = buildViewableStateFilters(
      [
        { state: 'draft', rights: { hasOwn: false, hasAny: false } },
        { state: 'archived', rights: { hasOwn: false, hasAny: false } },
      ],
      ownFilter,
    )

    expect(result).toEqual([])
  })

  it('supports a relational own-filter (articles)', () => {
    const result = buildViewableStateFilters(
      [{ state: 'archived', rights: { hasOwn: true, hasAny: false } }],
      { authors: { some: { id: 'author-1' } } },
    )

    expect(result).toEqual([
      { state: 'archived', authors: { some: { id: 'author-1' } } },
    ])
  })
})
