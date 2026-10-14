import { describe, expect, test } from 'vitest'

import { getEmptyListMessage } from './get-empty-list-message'

describe('getEmptyListMessage', () => {
  test('an empty list offers a new article', () => {
    expect(getEmptyListMessage({ hasOtherFilters: false, states: [] })).toEqual(
      {
        action: 'newArticle',
        text: 'Nový článek se uloží jako koncept.',
        title: 'Zatím tu není žádný článek',
      },
    )
  })

  test('one empty state has its sentence and no button', () => {
    expect(
      getEmptyListMessage({ hasOtherFilters: false, states: ['pending'] }),
    ).toEqual({
      action: null,
      text: null,
      title: 'Ke schválení nečekají žádné články.',
    })
  })

  test('empty Koncepty keep a new article', () => {
    expect(
      getEmptyListMessage({ hasOtherFilters: false, states: ['draft'] }).action,
    ).toBe('newArticle')
  })

  test('several empty states share one sentence', () => {
    expect(
      getEmptyListMessage({
        hasOtherFilters: false,
        states: ['pending', 'approved'],
      }),
    ).toEqual({
      action: null,
      text: null,
      title: 'Ve vybraných stavech nejsou žádné články.',
    })
  })

  test('several states with Koncepty keep a new article', () => {
    expect(
      getEmptyListMessage({
        hasOtherFilters: false,
        states: ['draft', 'submitted'],
      }).action,
    ).toBe('newArticle')
  })

  test('anything else found nothing and offers to clear the filters', () => {
    const noResult = {
      action: 'clearFilters',
      text: 'Žádný článek neodpovídá nastaveným filtrům.',
      title: 'Nic nenalezeno',
    }

    expect(getEmptyListMessage({ hasOtherFilters: true, states: [] })).toEqual(
      noResult,
    )
    expect(
      getEmptyListMessage({ hasOtherFilters: true, states: ['draft'] }),
    ).toEqual(noResult)
  })
})
