import { describe, expect, test } from 'vitest'

import { getSelectionBarContent } from './get-selection-bar-content'

describe('getSelectionBarContent', () => {
  test('offers the actions every selected article has', () => {
    expect(
      getSelectionBarContent([
        { bulkActions: ['publish', 'delete'], isIncomplete: false },
        { bulkActions: ['publish', 'delete'], isIncomplete: true },
      ]),
    ).toEqual({ actions: ['publish', 'delete'], message: null })
  })

  test('says no action is common when none is left', () => {
    expect(
      getSelectionBarContent([
        { bulkActions: ['publish', 'delete'], isIncomplete: false },
        { bulkActions: ['archive'], isIncomplete: false },
      ]),
    ).toEqual({ actions: [], message: 'Pro tento výběr není společná akce.' })
  })

  test('drops publishing when every selected article is incomplete', () => {
    expect(
      getSelectionBarContent([
        { bulkActions: ['publish', 'delete'], isIncomplete: true },
        { bulkActions: ['publish', 'delete'], isIncomplete: true },
      ]),
    ).toEqual({ actions: ['delete'], message: null })
  })

  test.each([
    [1, 'Vybraný článek nelze publikovat — je neúplný.'],
    [2, 'Vybrané články nelze publikovat — jsou neúplné.'],
  ])('says why when publishing was the only action (%i)', (count, message) => {
    expect(
      getSelectionBarContent(
        Array.from({ length: count }, () => ({
          bulkActions: ['publish' as const],
          isIncomplete: true,
        })),
      ),
    ).toEqual({ actions: [], message })
  })
})
