import { describe, expect, test } from 'vitest'

import { formatPublishedAtChange } from './format-published-at-change'
import { type ContentLogRow, toContentHistory } from './to-content-history'

const createdAt = new Date('2026-02-03T09:05:00.000Z')

const createRow = (
  overrides: Partial<ContentLogRow> & Pick<ContentLogRow, 'id' | 'event'>,
): ContentLogRow => ({
  actorId: 'marie',
  actorName: 'Marie Horáková',
  createdAt,
  detail: null,
  ...overrides,
})

const at = (time: string) => new Date(`2026-09-19T${time}:00.000Z`)

const dates: { createdAt: Date; publishedAt: Date | null } = {
  createdAt,
  publishedAt: null,
}

const summarize = (rows: ContentLogRow[], contentDates = dates) =>
  toContentHistory(rows, contentDates).entries.map(
    (entry) => `${entry.label} · ${entry.actorName}`,
  )

describe('toContentHistory', () => {
  test('lists the steps newest first, with the actor and the time', () => {
    const history = toContentHistory(
      [
        createRow({ event: 'create', id: 'created' }),
        createRow({
          actorId: 'petr',
          actorName: 'Petr Dvořák',
          createdAt: at('10:00'),
          event: 'return',
          id: 'returned',
        }),
      ],
      dates,
    )

    expect(history).toEqual({
      entries: [
        {
          actorName: 'Petr Dvořák',
          dateTime: '2026-09-19T10:00:00.000Z',
          formattedDateTime: '19. 9. 2026, 12:00',
          id: 'returned',
          label: 'Vráceno k úpravám',
          note: null,
        },
        {
          actorName: 'Marie Horáková',
          dateTime: '2026-02-03T09:05:00.000Z',
          formattedDateTime: '3. 2. 2026, 10:05',
          id: 'created',
          label: 'Vytvořeno',
          note: null,
        },
      ],
      isIncomplete: false,
    })
  })

  test('reads an approval and a publish of one step as one row', () => {
    expect(
      summarize([
        createRow({ event: 'create', id: 'created' }),
        createRow({ createdAt: at('10:00'), event: 'approve', id: 'approved' }),
        createRow({
          createdAt: at('10:00'),
          event: 'publish',
          id: 'published',
        }),
      ]),
    ).toEqual([
      'Schváleno a publikováno · Marie Horáková',
      'Vytvořeno · Marie Horáková',
    ])
  })

  test('keeps an approval and a later publish apart', () => {
    expect(
      summarize([
        createRow({ event: 'create', id: 'created' }),
        createRow({ createdAt: at('10:00'), event: 'approve', id: 'approved' }),
        createRow({
          createdAt: at('11:00'),
          event: 'publish',
          id: 'published',
        }),
      ]),
    ).toEqual([
      'Publikováno · Marie Horáková',
      'Schváleno · Marie Horáková',
      'Vytvořeno · Marie Horáková',
    ])
  })

  test('merges consecutive edits by one person into the newest', () => {
    const history = toContentHistory(
      [
        createRow({ event: 'create', id: 'created' }),
        createRow({ createdAt: at('10:00'), event: 'update', id: 'first' }),
        createRow({ createdAt: at('11:00'), event: 'update', id: 'second' }),
        createRow({
          actorId: 'petr',
          actorName: 'Petr Dvořák',
          createdAt: at('12:00'),
          event: 'update',
          id: 'other',
        }),
      ],
      dates,
    )

    expect(history.entries.map((entry) => entry.id)).toEqual([
      'other',
      'second',
      'created',
    ])
  })

  test('does not merge edits split by another step', () => {
    expect(
      summarize([
        createRow({ event: 'create', id: 'created' }),
        createRow({ createdAt: at('10:00'), event: 'update', id: 'first' }),
        createRow({ createdAt: at('11:00'), event: 'submit', id: 'submitted' }),
        createRow({ createdAt: at('12:00'), event: 'update', id: 'second' }),
      ]),
    ).toEqual([
      'Upraveno · Marie Horáková',
      'Odesláno ke schválení · Marie Horáková',
      'Upraveno · Marie Horáková',
      'Vytvořeno · Marie Horáková',
    ])
  })

  test('shows a replaced file beside the edit of the same step', () => {
    expect(
      summarize([
        createRow({ event: 'create', id: 'created' }),
        createRow({ createdAt: at('10:00'), event: 'update', id: 'updated' }),
        createRow({ createdAt: at('10:00'), event: 'pdf_uploaded', id: 'pdf' }),
      ]),
    ).toEqual([
      'PDF nahráno · Marie Horáková',
      'Upraveno · Marie Horáková',
      'Vytvořeno · Marie Horáková',
    ])
  })

  test('notes the old and the new publish date, with times only when they differ', () => {
    const noteFor = (from: Date, to: Date) =>
      toContentHistory(
        [
          createRow({ event: 'create', id: 'created' }),
          createRow({
            createdAt: at('10:00'),
            detail: formatPublishedAtChange(from, to),
            event: 'set_published_at',
            id: 'changed',
          }),
        ],
        dates,
      ).entries[0].note

    expect(
      noteFor(
        new Date('2026-09-19T08:00:00.000Z'),
        new Date('2026-09-18T08:00:00.000Z'),
      ),
    ).toBe('z 19. 9. 2026 na 18. 9. 2026')
    expect(
      noteFor(
        new Date('2026-09-19T08:00:00.000Z'),
        new Date('2026-09-18T09:30:00.000Z'),
      ),
    ).toBe('z 19. 9. 2026 10:00 na 18. 9. 2026 11:30')
  })

  test('shows a deleted author’s step without a name', () => {
    expect(
      toContentHistory(
        [
          createRow({
            actorId: null,
            actorName: null,
            event: 'create',
            id: 'created',
          }),
        ],
        dates,
      ).entries[0].actorName,
    ).toBeNull()
  })

  test('closes content older than the log with its own dates, without names', () => {
    const history = toContentHistory(
      [createRow({ createdAt: at('10:00'), event: 'update', id: 'updated' })],
      { createdAt, publishedAt: new Date('2026-03-01T09:00:00.000Z') },
    )

    expect(history.isIncomplete).toBe(true)
    expect(
      history.entries.map((entry) => [
        entry.label,
        entry.actorName,
        entry.formattedDateTime,
      ]),
    ).toEqual([
      ['Upraveno', 'Marie Horáková', '19. 9. 2026, 12:00'],
      ['Publikováno', null, '1. 3. 2026'],
      ['Vytvořeno', null, '3. 2. 2026'],
    ])
  })

  test('orders the fallback rows by date when the content was published before it was created', () => {
    expect(
      toContentHistory([], {
        createdAt,
        publishedAt: new Date('2003-04-01T08:00:00.000Z'),
      }).entries.map((entry) => [entry.label, entry.formattedDateTime]),
    ).toEqual([
      ['Vytvořeno', '3. 2. 2026'],
      ['Publikováno', '1. 4. 2003'],
    ])
  })

  test('leaves out the fallback publish once the log holds the publish', () => {
    // The publish stamps `publishedAt` a moment before its own log row.
    expect(
      summarize(
        [
          createRow({
            createdAt: new Date('2026-09-19T10:00:00.005Z'),
            event: 'publish',
            id: 'published',
          }),
        ],
        { createdAt, publishedAt: at('10:00') },
      ),
    ).toEqual(['Publikováno · Marie Horáková', 'Vytvořeno · null'])
  })

  test('leaves out a fallback publish newer than the oldest logged step', () => {
    expect(
      summarize(
        [createRow({ createdAt: at('09:00'), event: 'update', id: 'updated' })],
        { createdAt, publishedAt: at('10:00') },
      ),
    ).toEqual(['Upraveno · Marie Horáková', 'Vytvořeno · null'])
  })

  test('shows only the fallback for content with no log at all', () => {
    expect(toContentHistory([], dates)).toEqual({
      entries: [
        {
          actorName: null,
          dateTime: '2026-02-03T09:05:00.000Z',
          formattedDateTime: '3. 2. 2026',
          id: 'created',
          label: 'Vytvořeno',
          note: null,
        },
      ],
      isIncomplete: true,
    })
  })
})

describe('toContentHistory — the edit hold (07f)', () => {
  test('a takeover is its own row, between the edits around it', () => {
    expect(
      summarize([
        createRow({ createdAt: at('10:00'), event: 'update', id: 'author' }),
        createRow({
          actorId: 'petr',
          actorName: 'Petr Dvořák',
          createdAt: at('11:00'),
          event: 'take_over',
          id: 'take-over',
        }),
        createRow({
          actorId: 'petr',
          actorName: 'Petr Dvořák',
          createdAt: at('11:05'),
          event: 'update',
          id: 'coordinator',
        }),
        // Without it, the history closes with the article's own dates.
      ]).slice(0, 3),
    ).toEqual([
      'Upraveno · Petr Dvořák',
      'Převzata úprava · Petr Dvořák',
      'Upraveno · Marie Horáková',
    ])
  })
})
