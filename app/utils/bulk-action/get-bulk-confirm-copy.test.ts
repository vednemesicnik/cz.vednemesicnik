import { describe, expect, test } from 'vitest'

import { ARTICLE_BULK_NOUN, ISSUE_BULK_NOUN } from '~/config/bulk-noun-config'

import { getBulkConfirmCopy } from './get-bulk-confirm-copy'

const copy = (
  options: Omit<
    Parameters<typeof getBulkConfirmCopy>[0],
    'noun' | 'isCreator'
  > & {
    isCreator?: boolean
  },
) =>
  getBulkConfirmCopy({ isCreator: false, noun: ARTICLE_BULK_NOUN, ...options })

describe('getBulkConfirmCopy', () => {
  test('archives several articles', () => {
    expect(copy({ action: 'archive', count: 7, onlyDrafts: false })).toEqual({
      confirmLabel: 'Archivovat 7 článků',
      descriptions: [
        'Čtenáři články na webu neuvidí. V administraci zůstanou mezi archivovanými.',
      ],
      title: 'Archivovat 7 článků?',
    })
  })

  test('archives one article', () => {
    expect(
      copy({ action: 'archive', count: 1, onlyDrafts: false }).descriptions,
    ).toEqual([
      'Čtenáři článek na webu neuvidí. V administraci zůstane mezi archivovanými.',
    ])
  })

  test('deletes only drafts as koncepty', () => {
    expect(copy({ action: 'delete', count: 3, onlyDrafts: true })).toEqual({
      confirmLabel: 'Smazat 3 koncepty',
      descriptions: ['Smazání je nevratné.'],
      title: 'Smazat 3 koncepty?',
    })
  })

  test('deletes a mixed selection as články', () => {
    expect(copy({ action: 'delete', count: 3, onlyDrafts: false }).title).toBe(
      'Smazat 3 články?',
    )
  })

  test('retracts articles (22c)', () => {
    expect(copy({ action: 'retract', count: 5, onlyDrafts: false })).toEqual({
      confirmLabel: 'Stáhnout z publikace 5 článků',
      descriptions: [
        'Články se vrátí do konceptu. Čtenáři je na webu neuvidí.',
      ],
      title: 'Stáhnout z publikace 5 článků?',
    })
  })

  test('tells a Creator who publishes a retracted article again (22c, 23e)', () => {
    expect(
      copy({ action: 'retract', count: 1, isCreator: true, onlyDrafts: false })
        .descriptions,
    ).toEqual([
      'Článek se vrátí do konceptu. Čtenáři ho na webu neuvidí.',
      'Znovu ho publikovat může Koordinátor.',
    ])
  })

  test('restores articles as drafts (y0xq33k8)', () => {
    expect(copy({ action: 'restore', count: 2, onlyDrafts: false })).toEqual({
      confirmLabel: 'Obnovit jako koncept 2 články',
      descriptions: [
        'Články se vrátí do konceptu. Na web se dostanou až novou publikací.',
      ],
      title: 'Obnovit jako koncept 2 články?',
    })
  })
})

describe('getBulkConfirmCopy — issues (26f)', () => {
  const issueCopy = (
    action: Parameters<typeof getBulkConfirmCopy>[0]['action'],
    count: number,
  ) =>
    getBulkConfirmCopy({
      action,
      count,
      isCreator: false,
      noun: ISSUE_BULK_NOUN,
      onlyDrafts: true,
    })

  test('publishes and says where the issues appear', () => {
    expect(issueCopy('publish', 2)).toEqual({
      confirmLabel: 'Publikovat 2 čísla',
      descriptions: ['Čísla budou publikována v archivu na webu.'],
      title: 'Publikovat 2 čísla?',
    })
    expect(issueCopy('publish', 1).descriptions).toEqual([
      'Číslo bude publikováno v archivu na webu.',
    ])
  })

  test('deletes drafts as čísla, with their files', () => {
    expect(issueCopy('delete', 2)).toEqual({
      confirmLabel: 'Smazat 2 čísla',
      descriptions: ['Smažou se i jejich nahrané soubory. Vrátit to nejde.'],
      title: 'Smazat 2 čísla?',
    })
    expect(issueCopy('delete', 1).descriptions).toEqual([
      'Smažou se i jeho nahrané soubory. Vrátit to nejde.',
    ])
  })

  test('restores one issue', () => {
    expect(issueCopy('restore', 1)).toEqual({
      confirmLabel: 'Obnovit jako koncept 1 číslo',
      descriptions: [
        'Číslo se vrátí do konceptu. Na web se dostane až novou publikací.',
      ],
      title: 'Obnovit jako koncept 1 číslo?',
    })
  })

  test('the articles publish in a dialog of their own', () => {
    expect(
      copy({ action: 'publish', count: 3, onlyDrafts: false }).descriptions,
    ).toEqual([])
  })
})
