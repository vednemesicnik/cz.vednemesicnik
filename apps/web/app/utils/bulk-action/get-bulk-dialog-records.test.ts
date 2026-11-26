import { describe, expect, test } from 'vitest'

import { CATEGORY_BULK_NOUN, ISSUE_BULK_NOUN } from '~/config/bulk-noun-config'

import { getBulkDialogRecords } from './get-bulk-dialog-records'

const CATEGORIES = [
  { id: 'a', related: { count: 18, publishedCount: 18 }, title: 'Kultura' },
  { id: 'b', related: { count: 3, publishedCount: 0 }, title: 'Ankety' },
]

describe('getBulkDialogRecords', () => {
  test('retracting lists the published articles, none without brackets (25g)', () => {
    expect(
      getBulkDialogRecords(CATEGORIES, 'retract', CATEGORY_BULK_NOUN),
    ).toEqual({
      hasRelated: true,
      records: [
        { id: 'a', title: 'Kultura (18 publikovaných článků)' },
        { id: 'b', title: 'Ankety' },
      ],
    })
  })

  test('deleting lists every assigned article (25g)', () => {
    expect(
      getBulkDialogRecords(CATEGORIES, 'delete', CATEGORY_BULK_NOUN).records,
    ).toEqual([
      { id: 'a', title: 'Kultura (18 článků)' },
      { id: 'b', title: 'Ankety (3 články)' },
    ])
  })

  test('archiving categories without published articles has none (25g)', () => {
    expect(
      getBulkDialogRecords([CATEGORIES[1]], 'archive', CATEGORY_BULK_NOUN)
        .hasRelated,
    ).toBe(false)
  })

  test('publishing and restoring list the names alone', () => {
    expect(
      getBulkDialogRecords(CATEGORIES, 'restore', CATEGORY_BULK_NOUN).records,
    ).toEqual([
      { id: 'a', title: 'Kultura' },
      { id: 'b', title: 'Ankety' },
    ])
  })

  test('a list without related content lists its titles', () => {
    expect(
      getBulkDialogRecords(
        [{ id: 'i', title: 'zima 2026' }],
        'delete',
        ISSUE_BULK_NOUN,
      ),
    ).toEqual({ hasRelated: false, records: [{ id: 'i', title: 'zima 2026' }] })
  })
})
