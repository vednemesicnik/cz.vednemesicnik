import { describe, expect, test } from 'vitest'

import { getCommonBulkActions } from './get-common-bulk-actions'

describe('getCommonBulkActions', () => {
  test('keeps the actions every selected article has', () => {
    expect(
      getCommonBulkActions([
        ['publish', 'delete'],
        ['publish', 'delete'],
        ['publish'],
      ]),
    ).toEqual(['publish'])
  })

  test('is empty when a published article joins drafts', () => {
    expect(getCommonBulkActions([['publish', 'delete'], ['archive']])).toEqual(
      [],
    )
  })

  test('is empty for an empty selection', () => {
    expect(getCommonBulkActions([])).toEqual([])
  })
})
