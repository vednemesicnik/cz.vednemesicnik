import { beforeEach, describe, expect, test, vi } from 'vitest'

const { contentLogCreateMany } = vi.hoisted(() => ({
  contentLogCreateMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { contentLog: { createMany: contentLogCreateMany } },
}))

import { recordContentLog } from './record-content-log.server'

const actor = { authorId: 'marie', authorName: 'Marie Horáková' }

describe('recordContentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('writes every event of one step with one time and the actor', async () => {
    contentLogCreateMany.mockResolvedValue({ count: 2 })

    await recordContentLog(
      {
        entity: 'article',
        entityId: 'article-1',
        events: ['approve', 'publish'],
      },
      actor,
    )

    const rows = contentLogCreateMany.mock.lastCall?.[0].data
    expect(rows).toEqual([
      expect.objectContaining({ actorId: 'marie', event: 'approve' }),
      expect.objectContaining({ actorId: 'marie', event: 'publish' }),
    ])
    expect(rows[0].createdAt).toBeInstanceOf(Date)
    expect(rows[1].createdAt).toBe(rows[0].createdAt)
  })

  test('carries the detail onto its row', async () => {
    contentLogCreateMany.mockResolvedValue({ count: 1 })

    await recordContentLog(
      {
        detail: '2026-09-19T08:00:00.000Z → 2026-09-18T08:00:00.000Z',
        entity: 'issue',
        entityId: 'issue-1',
        events: ['set_published_at'],
      },
      actor,
    )

    expect(contentLogCreateMany.mock.lastCall?.[0].data).toEqual([
      expect.objectContaining({
        detail: '2026-09-19T08:00:00.000Z → 2026-09-18T08:00:00.000Z',
        entity: 'issue',
        entityId: 'issue-1',
      }),
    ])
  })

  test('never rejects: a failed write is only logged', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    contentLogCreateMany.mockRejectedValue(new Error('database down'))

    await expect(
      recordContentLog(
        { entity: 'article', entityId: 'article-1', events: ['update'] },
        actor,
      ),
    ).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()
  })
})
