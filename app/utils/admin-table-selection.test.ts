import { describe, expect, test } from 'vitest'

import {
  getSelectedIds,
  toggleAllSelection,
  toggleSelection,
} from '~/utils/admin-table-selection'

describe('toggleSelection', () => {
  test('adds an id that is not selected', () => {
    expect([...toggleSelection(new Set(['a']), 'b')]).toEqual(['a', 'b'])
  })

  test('removes an id that is already selected', () => {
    expect([...toggleSelection(new Set(['a', 'b']), 'a')]).toEqual(['b'])
  })

  test('does not mutate the input set', () => {
    const input = new Set(['a'])
    toggleSelection(input, 'b')
    expect([...input]).toEqual(['a'])
  })
})

describe('toggleAllSelection', () => {
  test('selects all selectable ids when none are selected', () => {
    expect([...toggleAllSelection(new Set(), ['a', 'b'])]).toEqual(['a', 'b'])
  })

  test('clears the selectable ids when all are already selected', () => {
    expect([...toggleAllSelection(new Set(['a', 'b']), ['a', 'b'])]).toEqual([])
  })

  test('selects the rest when only some are selected', () => {
    expect([...toggleAllSelection(new Set(['a']), ['a', 'b'])]).toEqual([
      'a',
      'b',
    ])
  })

  test('leaves ids outside the selectable set untouched when clearing', () => {
    expect([
      ...toggleAllSelection(new Set(['a', 'b', 'x']), ['a', 'b']),
    ]).toEqual(['x'])
  })

  test('does nothing for an empty selectable set', () => {
    expect([...toggleAllSelection(new Set(['a']), [])]).toEqual(['a'])
  })
})

describe('getSelectedIds', () => {
  test('returns the intersection with the selectable ids', () => {
    expect(getSelectedIds(new Set(['a', 'b']), ['a', 'c'])).toEqual(['a'])
  })

  test('prunes ids that are no longer selectable', () => {
    // e.g. after pagination/search/revalidation the visible id set shrinks
    expect(getSelectedIds(new Set(['a', 'b', 'c']), ['b'])).toEqual(['b'])
  })

  test('preserves the order of selectableIds', () => {
    expect(getSelectedIds(new Set(['a', 'b']), ['b', 'a'])).toEqual(['b', 'a'])
  })

  test('returns an empty array when nothing overlaps', () => {
    expect(getSelectedIds(new Set(['a']), ['b', 'c'])).toEqual([])
  })
})
