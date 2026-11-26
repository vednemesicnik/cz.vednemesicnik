import { describe, expect, test } from 'vitest'

import { ARTICLE_NOUN, CATEGORY_NOUN } from '~/config/list-noun-config'

import { getListEmptyMessage } from './get-list-empty-message'

describe('getListEmptyMessage', () => {
  test('an empty list offers a new article', () => {
    expect(
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: ARTICLE_NOUN,
        states: [],
      }),
    ).toEqual({
      action: 'create',
      text: 'Nový článek se uloží jako koncept.',
      title: 'Zatím tu není žádný článek',
    })
  })

  test('one empty state has its sentence and no button', () => {
    expect(
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: ARTICLE_NOUN,
        states: ['pending'],
      }),
    ).toEqual({
      action: null,
      text: null,
      title: 'Ke schválení nečekají žádné články.',
    })
  })

  test('empty Koncepty keep a new article', () => {
    expect(
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: ARTICLE_NOUN,
        states: ['draft'],
      }).action,
    ).toBe('create')
  })

  test('several empty states share one sentence', () => {
    expect(
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: ARTICLE_NOUN,
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
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: ARTICLE_NOUN,
        states: ['draft', 'submitted'],
      }).action,
    ).toBe('create')
  })

  test('anything else found nothing and offers to clear the filters', () => {
    const noResult = {
      action: 'clearFilters',
      text: 'Žádný článek neodpovídá nastaveným filtrům.',
      title: 'Nic nenalezeno',
    }

    expect(
      getListEmptyMessage({
        hasOtherFilters: true,
        noun: ARTICLE_NOUN,
        states: [],
      }),
    ).toEqual(noResult)
    expect(
      getListEmptyMessage({
        hasOtherFilters: true,
        noun: ARTICLE_NOUN,
        states: ['draft'],
      }),
    ).toEqual(noResult)
  })

  test('speaks in the noun of the list, without a sentence where none is true', () => {
    expect(
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: CATEGORY_NOUN,
        states: [],
      }),
    ).toEqual({
      action: 'create',
      text: null,
      title: 'Zatím tu není žádná rubrika',
    })
    expect(
      getListEmptyMessage({
        hasOtherFilters: false,
        noun: CATEGORY_NOUN,
        states: ['pending', 'approved'],
      }).title,
    ).toBe('Ve vybraných stavech nejsou žádné rubriky.')
  })
})
