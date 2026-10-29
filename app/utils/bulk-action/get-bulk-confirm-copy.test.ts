import { describe, expect, test } from 'vitest'

import {
  ARTICLE_BULK_NOUN,
  CATEGORY_BULK_NOUN,
  ISSUE_BULK_NOUN,
  PODCAST_BULK_NOUN,
  TAG_BULK_NOUN,
} from '~/config/bulk-noun-config'

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

describe('getBulkConfirmCopy — categories and tags (25g)', () => {
  const taxonomyCopy = (
    options: Partial<Parameters<typeof getBulkConfirmCopy>[0]> &
      Pick<Parameters<typeof getBulkConfirmCopy>[0], 'action' | 'count'>,
  ) =>
    getBulkConfirmCopy({
      hasRelated: true,
      isCreator: false,
      noun: CATEGORY_BULK_NOUN,
      onlyDrafts: true,
      ...options,
    })

  test('retracts categories with published articles', () => {
    expect(taxonomyCopy({ action: 'retract', count: 3 })).toEqual({
      confirmLabel: 'Stáhnout z publikace 3 rubriky',
      descriptions: [
        'Rubriky se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
      ],
      title: 'Stáhnout z publikace 3 rubriky?',
    })
  })

  test('a Creator’s sentence follows the first one (y0xq33k8)', () => {
    expect(
      taxonomyCopy({ action: 'retract', count: 1, isCreator: true })
        .descriptions,
    ).toEqual([
      'Rubrika se vrátí do konceptu. Znovu ji publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazená, ale na webu se u nich nezobrazí.',
    ])
  })

  test('without published articles the last sentence goes', () => {
    expect(
      taxonomyCopy({
        action: 'archive',
        count: 8,
        hasRelated: false,
        noun: TAG_BULK_NOUN,
      }),
    ).toEqual({
      confirmLabel: 'Archivovat 8 štítků',
      descriptions: ['Štítky zmizí z webu i z nabídky v editoru článku.'],
      title: 'Archivovat 8 štítků?',
    })
  })

  test('deletes one category in the accusative, its articles kept', () => {
    expect(taxonomyCopy({ action: 'delete', count: 1 })).toEqual({
      confirmLabel: 'Smazat 1 rubriku',
      descriptions: [
        'Rubrika se trvale smaže a odebere z přiřazených článků. Články se nesmažou.',
      ],
      title: 'Smazat 1 rubriku?',
    })
    expect(
      taxonomyCopy({ action: 'delete', count: 3, hasRelated: false })
        .descriptions,
    ).toEqual(['Rubriky se trvale smažou.'])
  })

  test('publishes tags without a date or an order', () => {
    expect(
      taxonomyCopy({ action: 'publish', count: 2, noun: TAG_BULK_NOUN })
        .descriptions,
    ).toEqual(['Štítky budou na webu.'])
  })
})

describe('getBulkConfirmCopy — the Creator’s sentence after the first one (25g)', () => {
  test.each([
    [
      CATEGORY_BULK_NOUN,
      1,
      true,
      'Rubrika se vrátí do konceptu. Znovu ji publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazená, ale na webu se u nich nezobrazí.',
    ],
    [
      CATEGORY_BULK_NOUN,
      1,
      false,
      'Rubrika se vrátí do konceptu. Znovu ji publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku.',
    ],
    [
      CATEGORY_BULK_NOUN,
      3,
      true,
      'Rubriky se vrátí do konceptu. Znovu je publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
    ],
    [
      CATEGORY_BULK_NOUN,
      3,
      false,
      'Rubriky se vrátí do konceptu. Znovu je publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku.',
    ],
    [
      TAG_BULK_NOUN,
      1,
      true,
      'Štítek se vrátí do konceptu. Znovu ho publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazený, ale na webu se u nich nezobrazí.',
    ],
    [
      TAG_BULK_NOUN,
      1,
      false,
      'Štítek se vrátí do konceptu. Znovu ho publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku.',
    ],
    [
      TAG_BULK_NOUN,
      3,
      true,
      'Štítky se vrátí do konceptu. Znovu je publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
    ],
    [
      TAG_BULK_NOUN,
      3,
      false,
      'Štítky se vrátí do konceptu. Znovu je publikovat může Koordinátor. Zmizí z webu i z nabídky v editoru článku.',
    ],
  ])('%#', (noun, count, hasRelated, expected) => {
    expect(
      getBulkConfirmCopy({
        action: 'retract',
        count,
        hasRelated,
        isCreator: true,
        noun,
        onlyDrafts: false,
      }).descriptions,
    ).toEqual([expected])
  })
})

describe('getBulkConfirmCopy — podcasts (27a, gzumlpu2)', () => {
  const podcastCopy = (
    options: Partial<Parameters<typeof getBulkConfirmCopy>[0]> &
      Pick<Parameters<typeof getBulkConfirmCopy>[0], 'action' | 'count'>,
  ) =>
    getBulkConfirmCopy({
      hasRelated: true,
      isCreator: false,
      noun: PODCAST_BULK_NOUN,
      onlyDrafts: false,
      ...options,
    })

  test('retracting podcasts with published episodes says they leave too', () => {
    expect(podcastCopy({ action: 'retract', count: 2 }).descriptions).toEqual([
      'Podcasty se vrátí do konceptu. Z webu zmizí i jejich publikované epizody. Stav epizod se nezmění. Po nové publikaci příslušného podcastu se jeho publikované epizody znovu zobrazí.',
    ])
  })

  test('without published episodes the sentences about them go (gzumlpu2)', () => {
    expect(
      podcastCopy({ action: 'retract', count: 2, hasRelated: false })
        .descriptions,
    ).toEqual(['Podcasty se vrátí do konceptu.'])
    expect(
      podcastCopy({ action: 'archive', count: 1, hasRelated: false })
        .descriptions,
    ).toEqual([
      'Podcast zmizí z webu. Na web se dostane až po obnovení jako konceptu a publikaci.',
    ])
  })

  test('a Creator’s sentence ends a one-sentence retract', () => {
    expect(
      podcastCopy({
        action: 'retract',
        count: 2,
        hasRelated: false,
        isCreator: true,
      }).descriptions,
    ).toEqual([
      'Podcasty se vrátí do konceptu. Znovu je publikovat může Koordinátor.',
    ])
  })
})
