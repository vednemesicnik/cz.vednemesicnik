import { beforeEach, describe, expect, test, vi } from 'vitest'

const { contentLogFindMany } = vi.hoisted(() => ({
  contentLogFindMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { contentLog: { findMany: contentLogFindMany } },
}))

import { getContentHistory } from './get-content-history.server'

const content = {
  createdAt: new Date('2026-02-03T09:05:00.000Z'),
  entity: 'article' as const,
  entityId: 'article-1',
  publishedAt: null,
}

describe('getContentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("reads the content's own rows, newest first", async () => {
    contentLogFindMany.mockResolvedValue([])

    await getContentHistory(content)

    expect(contentLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        where: { entity: 'article', entityId: 'article-1' },
      }),
    )
  })

  test("names each actor, and none for a deleted one's", async () => {
    contentLogFindMany.mockResolvedValue([
      {
        actor: null,
        actorId: null,
        createdAt: new Date('2026-09-19T10:00:00.000Z'),
        detail: null,
        event: 'update',
        id: 'by-deleted',
      },
      {
        actor: { name: 'Marie Horáková' },
        actorId: 'marie',
        createdAt: content.createdAt,
        detail: null,
        event: 'create',
        id: 'created',
      },
    ])

    const history = await getContentHistory(content)

    expect(
      history.entries.map((entry) => [entry.label, entry.actorName]),
    ).toEqual([
      ['Upraveno', null],
      ['Vytvořeno', 'Marie Horáková'],
    ])
    expect(history.isIncomplete).toBe(false)
  })

  test("passes the content's own dates to the fallback", async () => {
    contentLogFindMany.mockResolvedValue([])

    const history = await getContentHistory({
      ...content,
      publishedAt: new Date('2026-03-01T09:00:00.000Z'),
    })

    expect(history.isIncomplete).toBe(true)
    expect(history.entries.map((entry) => entry.dateTime)).toEqual([
      '2026-03-01T09:00:00.000Z',
      '2026-02-03T09:05:00.000Z',
    ])
  })
})
