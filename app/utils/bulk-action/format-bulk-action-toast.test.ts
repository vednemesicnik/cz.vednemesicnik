import { describe, expect, test } from 'vitest'

import { ARTICLE_BULK_NOUN, PODCAST_BULK_NOUN } from '~/config/bulk-noun-config'

import { formatBulkActionToast } from './format-bulk-action-toast'

describe('formatBulkActionToast', () => {
  test('names the verb and the real count', () => {
    expect(
      formatBulkActionToast({
        action: 'publish',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 3,
        skippedCount: 0,
      }),
    ).toBe('Publikováno: 3 články')
  })

  test('adds what was skipped', () => {
    expect(
      formatBulkActionToast({
        action: 'publish',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 2,
        skippedCount: 1,
      }),
    ).toBe('Publikováno: 2 články. Přeskočeno: 1 článek.')
  })

  test('says nothing was done when everything was skipped', () => {
    expect(
      formatBulkActionToast({
        action: 'publish',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 0,
        skippedCount: 3,
      }),
    ).toBe('Nic nebylo publikováno. Přeskočeno: 3 články.')
  })

  test('archives articles', () => {
    expect(
      formatBulkActionToast({
        action: 'archive',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 7,
        skippedCount: 0,
      }),
    ).toBe('Archivováno: 7 článků')
  })

  test('deleting only drafts counts koncepty', () => {
    expect(
      formatBulkActionToast({
        action: 'delete',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: true,
        processedCount: 3,
        skippedCount: 0,
      }),
    ).toBe('Smazáno: 3 koncepty')
  })

  test('deleting a mixed selection counts články', () => {
    expect(
      formatBulkActionToast({
        action: 'delete',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 2,
        skippedCount: 1,
      }),
    ).toBe('Smazáno: 2 články. Přeskočeno: 1 článek.')
  })

  test('retracts articles (22c)', () => {
    expect(
      formatBulkActionToast({
        action: 'retract',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 5,
        skippedCount: 0,
      }),
    ).toBe('Staženo z publikace: 5 článků')
  })

  test('restores articles as drafts (y0xq33k8)', () => {
    expect(
      formatBulkActionToast({
        action: 'restore',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 2,
        skippedCount: 0,
      }),
    ).toBe('Obnoveno jako koncept: 2 články')
  })

  test('says nothing was restored', () => {
    expect(
      formatBulkActionToast({
        action: 'restore',
        noun: ARTICLE_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 0,
        skippedCount: 1,
      }),
    ).toBe('Nic nebylo obnoveno jako koncept. Přeskočeno: 1 článek.')
  })
})

describe('formatBulkActionToast — podcasts (27a, 0farrwua)', () => {
  test.each([
    [
      2,
      0,
      true,
      'Staženo z publikace: 2 podcasty. Z webu zmizely i jejich publikované epizody.',
    ],
    [
      1,
      0,
      true,
      'Staženo z publikace: 1 podcast. Z webu zmizely i jeho publikované epizody.',
    ],
    [
      1,
      1,
      true,
      'Staženo z publikace: 1 podcast. Z webu zmizely i jeho publikované epizody. Přeskočeno: 1 podcast.',
    ],
    [2, 0, false, 'Staženo z publikace: 2 podcasty'],
  ])(
    '%i retracted, %i skipped, published episodes %s',
    (processedCount, skippedCount, hasRelated, expected) => {
      expect(
        formatBulkActionToast({
          action: 'retract',
          hasRelated,
          noun: PODCAST_BULK_NOUN,
          onlyDrafts: false,
          processedCount,
          skippedCount,
        }),
      ).toBe(expected)
    },
  )

  test('archiving says nothing more (27a)', () => {
    expect(
      formatBulkActionToast({
        action: 'archive',
        hasRelated: true,
        noun: PODCAST_BULK_NOUN,
        onlyDrafts: false,
        processedCount: 2,
        skippedCount: 0,
      }),
    ).toBe('Archivováno: 2 podcasty')
  })
})
