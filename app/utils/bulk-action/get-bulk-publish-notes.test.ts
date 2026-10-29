import { describe, expect, test } from 'vitest'

import { ARTICLE_BULK_NOUN } from '~/config/bulk-noun-config'

import { getBulkPublishNotes } from './get-bulk-publish-notes'

describe('getBulkPublishNotes', () => {
  test('says nothing when nothing waits, everything was submitted and complete', () => {
    expect(
      getBulkPublishNotes({
        incompleteCount: 0,
        notSubmittedCount: 0,
        noun: ARTICLE_BULK_NOUN,
        pendingCount: 0,
      }),
    ).toEqual({ notes: null, skipped: null })
  })

  test('joins the waiting and not-submitted sentences', () => {
    expect(
      getBulkPublishNotes({
        incompleteCount: 0,
        notSubmittedCount: 1,
        noun: ARTICLE_BULK_NOUN,
        pendingCount: 1,
      }).notes,
    ).toBe(
      '1 článek čeká na schválení. Publikováním ho schválíte. 1 článek není odeslaný ke schválení.',
    )
  })

  test.each([
    [2, '2 články čekají na schválení. Publikováním je schválíte.'],
    [5, '5 článků čeká na schválení. Publikováním je schválíte.'],
  ])('waiting: %i', (pendingCount, expected) => {
    expect(
      getBulkPublishNotes({
        incompleteCount: 0,
        notSubmittedCount: 0,
        noun: ARTICLE_BULK_NOUN,
        pendingCount,
      }).notes,
    ).toBe(expected)
  })

  test.each([
    [2, '2 články nejsou odeslané ke schválení.'],
    [5, '5 článků není odeslaných ke schválení.'],
  ])('not submitted: %i', (notSubmittedCount, expected) => {
    expect(
      getBulkPublishNotes({
        incompleteCount: 0,
        notSubmittedCount,
        noun: ARTICLE_BULK_NOUN,
        pendingCount: 0,
      }).notes,
    ).toBe(expected)
  })

  test.each([
    [1, '1 článek je neúplný. Přeskočí se.'],
    [3, '3 články jsou neúplné. Přeskočí se.'],
    [6, '6 článků je neúplných. Přeskočí se.'],
  ])('incomplete: %i', (incompleteCount, expected) => {
    expect(
      getBulkPublishNotes({
        incompleteCount,
        notSubmittedCount: 0,
        noun: ARTICLE_BULK_NOUN,
        pendingCount: 0,
      }).skipped,
    ).toBe(expected)
  })
})
