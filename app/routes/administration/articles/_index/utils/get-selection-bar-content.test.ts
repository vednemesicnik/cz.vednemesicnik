import { describe, expect, test } from 'vitest'

import { getSelectionBarContent } from './get-selection-bar-content'

describe('getSelectionBarContent', () => {
  test('offers the actions every selected article has', () => {
    expect(
      getSelectionBarContent([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: false,
        },
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: true,
        },
      ]),
    ).toEqual({ actions: ['publish', 'delete'], message: null })
  })

  test('says no action is common when none is left', () => {
    expect(
      getSelectionBarContent([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: false,
        },
        { bulkActions: ['archive'], isHeldByOther: false, isIncomplete: false },
      ]),
    ).toEqual({ actions: [], message: 'Pro tento výběr není společná akce.' })
  })

  test('drops publishing when every selected article is incomplete', () => {
    expect(
      getSelectionBarContent([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: true,
        },
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: true,
        },
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
          isHeldByOther: false,
          isIncomplete: true,
        })),
      ),
    ).toEqual({ actions: [], message })
  })

  test('offers an action that skips a held article (22f)', () => {
    expect(
      getSelectionBarContent([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: false,
        },
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: true,
          isIncomplete: false,
        },
      ]),
    ).toEqual({ actions: ['publish', 'delete'], message: null })
  })

  test('offers nothing when every selected article is held (22c)', () => {
    expect(
      getSelectionBarContent([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: true,
          isIncomplete: false,
        },
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: true,
          isIncomplete: false,
        },
      ]),
    ).toEqual({ actions: [], message: 'Pro tento výběr není společná akce.' })
  })

  test('drops publishing when every selected article is incomplete or held', () => {
    expect(
      getSelectionBarContent([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: true,
          isIncomplete: false,
        },
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: false,
          isIncomplete: true,
        },
      ]),
    ).toEqual({ actions: ['delete'], message: null })
  })
})
