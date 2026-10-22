import { describe, expect, test } from 'vitest'

import { getEditHeldRefusal } from './get-edit-held-refusal'

const now = new Date('2026-10-22T10:00:00Z')

const heldBy = (authorId: string, heldUntil: Date) => ({
  heldByAuthor: { name: 'Jakub Novák' },
  heldByAuthorId: authorId,
  heldByTabId: 'tab-1',
  heldSince: new Date('2026-10-22T09:55:00Z'),
  heldUntil,
})

const later = new Date('2026-10-22T10:01:00Z')
const earlier = new Date('2026-10-22T09:59:00Z')

describe('getEditHeldRefusal', () => {
  test('someone else’s hold refuses every write', () => {
    expect(
      getEditHeldRefusal(heldBy('author-2', later), {
        authorId: 'author-1',
        countsOwnOtherTab: false,
        now,
      }),
    ).toEqual({ heldByName: 'Jakub Novák', isOwnOtherTab: false })
  })

  test('one’s own other tab refuses only a delete (0036)', () => {
    const content = heldBy('author-1', later)

    expect(
      getEditHeldRefusal(content, {
        authorId: 'author-1',
        countsOwnOtherTab: true,
        now,
      }),
    ).toEqual({ heldByName: 'Jakub Novák', isOwnOtherTab: true })
    expect(
      getEditHeldRefusal(content, {
        authorId: 'author-1',
        countsOwnOtherTab: false,
        now,
      }),
    ).toBeNull()
  })

  test('an expired or missing hold refuses nothing', () => {
    expect(
      getEditHeldRefusal(heldBy('author-2', earlier), {
        authorId: 'author-1',
        countsOwnOtherTab: true,
        now,
      }),
    ).toBeNull()
    expect(
      getEditHeldRefusal(
        {
          heldByAuthor: null,
          heldByAuthorId: null,
          heldByTabId: null,
          heldSince: null,
          heldUntil: null,
        },
        { authorId: 'author-1', countsOwnOtherTab: true, now },
      ),
    ).toBeNull()
  })
})
