import { describe, expect, test } from 'vitest'

import { getListPreview } from './get-list-preview'

describe('getListPreview', () => {
  test('a list of published items has no preview', () => {
    expect(getListPreview([{ previewState: null }])).toBeNull()
  })

  test('an empty list has no preview', () => {
    expect(getListPreview([])).toBeNull()
  })

  test('one unpublished item makes it a preview list', () => {
    expect(
      getListPreview([{ previewState: null }, { previewState: 'archived' }]),
    ).toEqual({ kind: 'list' })
  })
})
