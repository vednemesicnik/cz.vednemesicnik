import { describe, expect, test } from 'vitest'

import {
  ARTICLE_BULK_NOUN,
  CATEGORY_BULK_NOUN,
  ISSUE_BULK_NOUN,
} from '~/config/bulk-noun-config'

import { getSelectionBarContent } from './get-selection-bar-content'

const content = (selected: Parameters<typeof getSelectionBarContent>[0]) =>
  getSelectionBarContent(selected, ARTICLE_BULK_NOUN)

describe('getSelectionBarContent', () => {
  test('offers the actions every selected article has', () => {
    expect(
      content([
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
      content([
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
      content([
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
      content(
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
      content([
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

  test('says so when every selected article is held (22c)', () => {
    expect(
      content([
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
    ).toEqual({
      actions: [],
      message: 'Všechny vybrané články se právě upravují.',
    })
  })

  test('says so when the one selected article is held (22c)', () => {
    expect(
      content([
        {
          bulkActions: ['retract', 'archive'],
          isHeldByOther: true,
          isIncomplete: false,
        },
      ]),
    ).toEqual({ actions: [], message: 'Vybraný článek se právě upravuje.' })
  })

  test('a held selection with no common action says that instead', () => {
    expect(
      content([
        {
          bulkActions: ['publish', 'delete'],
          isHeldByOther: true,
          isIncomplete: false,
        },
        {
          bulkActions: ['retract', 'archive'],
          isHeldByOther: true,
          isIncomplete: false,
        },
      ]),
    ).toEqual({ actions: [], message: 'Pro tento výběr není společná akce.' })
  })

  test('offers retract and archive for published articles (ji6n8th3)', () => {
    expect(
      content([
        {
          bulkActions: ['retract', 'archive'],
          isHeldByOther: false,
          isIncomplete: false,
        },
        {
          bulkActions: ['retract', 'archive'],
          isHeldByOther: false,
          isIncomplete: false,
        },
      ]),
    ).toEqual({ actions: ['retract', 'archive'], message: null })
  })

  test('drops publishing when every selected article is incomplete or held', () => {
    expect(
      content([
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

describe('getSelectionBarContent — issues (26f)', () => {
  test.each([
    [1, 'Vybrané číslo se právě upravuje.'],
    [2, 'Všechna vybraná čísla se právě upravují.'],
  ])('every selected issue held (%i)', (count, message) => {
    expect(
      getSelectionBarContent(
        Array.from({ length: count }, () => ({
          bulkActions: ['retract' as const, 'archive' as const],
          isHeldByOther: true,
          isIncomplete: false,
        })),
        ISSUE_BULK_NOUN,
      ),
    ).toEqual({ actions: [], message })
  })

  test('two incomplete issues with publishing alone (26f)', () => {
    expect(
      getSelectionBarContent(
        [
          {
            bulkActions: ['publish'],
            isHeldByOther: false,
            isIncomplete: true,
          },
          {
            bulkActions: ['publish'],
            isHeldByOther: false,
            isIncomplete: true,
          },
        ],
        ISSUE_BULK_NOUN,
      ),
    ).toEqual({
      actions: [],
      message: 'Vybraná čísla nelze publikovat — jsou neúplná.',
    })
  })
})

describe('getSelectionBarContent — categories (25g)', () => {
  test('content with no edit hold falls back to no common action', () => {
    expect(
      getSelectionBarContent(
        [
          {
            bulkActions: ['retract', 'archive'],
            isHeldByOther: true,
            isIncomplete: false,
          },
        ],
        CATEGORY_BULK_NOUN,
      ),
    ).toEqual({ actions: [], message: 'Pro tento výběr není společná akce.' })
  })
})
