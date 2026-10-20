import { beforeEach, describe, expect, test, vi } from 'vitest'

import { recordEditLog } from './record-edit-log.server'

const mocks = vi.hoisted(() => ({
  contentLogCount: vi.fn(),
  contentLogFindFirst: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    contentLog: {
      count: mocks.contentLogCount,
      findFirst: mocks.contentLogFindFirst,
    },
  },
}))

const context = { authorId: 'author-1', roleLevel: 3 } as Parameters<
  typeof recordEditLog
>[0]

const options = {
  entity: 'article',
  entityId: 'article-1',
  isCreation: false,
} as const

beforeEach(() => {
  vi.clearAllMocks()
  mocks.contentLogCount.mockResolvedValue(0)
  mocks.contentLogFindFirst.mockResolvedValue(null)
})

describe('recordEditLog (07f)', () => {
  test('logs the creation and announces it', async () => {
    await recordEditLog(context, {
      ...options,
      heldSince: new Date(),
      isCreation: true,
    })

    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      { entity: 'article', entityId: 'article-1', events: ['create'] },
      context,
    )
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'create', entity: 'article', entityId: 'article-1' },
      context,
    )
  })

  test('logs Upraveno once per hold, announces every save', async () => {
    mocks.contentLogCount.mockResolvedValue(1)

    await recordEditLog(context, { ...options, heldSince: new Date() })

    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).toHaveBeenCalledOnce()
  })

  test('without a hold, adds nothing after the same author’s last edit', async () => {
    mocks.contentLogFindFirst.mockResolvedValue({
      actorId: 'author-1',
      event: 'update',
    })

    await recordEditLog(context, { ...options, heldSince: null })

    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('without a hold, logs Upraveno after someone else’s entry', async () => {
    mocks.contentLogFindFirst.mockResolvedValue({
      actorId: 'author-2',
      event: 'update',
    })

    await recordEditLog(context, { ...options, heldSince: null })

    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      { entity: 'article', entityId: 'article-1', events: ['update'] },
      context,
    )
  })
})
