import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createSubmissionHandlers } from './create-submission-handlers.server'

// Pass-through permission wrapper with a switchable signed-in author; the
// entity's Prisma work is the config's callbacks.
const mocks = vi.hoisted(() => ({
  permissionContext: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute(mocks.permissionContext()),
  }),
)

const request = new Request('https://test.local/')
const target = { authorIds: ['contributor'], state: 'draft' as const }
const submittedAt = new Date('2026-10-13T10:00:00Z')

const draft = {
  authors: [{ id: 'contributor', role: { level: 3 } }],
  state: 'draft' as const,
  submittedAt: null,
}

const createConfig = () => ({
  clearSubmission: vi.fn().mockResolvedValue(undefined),
  entity: 'podcast_episode' as const,
  loadSubmissionState: vi.fn().mockResolvedValue(draft),
  markSubmitted: vi.fn().mockResolvedValue(1),
})

const signInAs = (authorId: string, roleLevel: number) =>
  mocks.permissionContext.mockReturnValue({ authorId, roleLevel })

beforeEach(() => {
  vi.clearAllMocks()
  signInAs('contributor', 3)
})

describe('createSubmissionHandlers — an entity without a completeness check', () => {
  test('submits a draft, logs it and announces it', async () => {
    const config = createConfig()
    const handlers = createSubmissionHandlers(config)

    await expect(
      handlers.submit(request, { id: 'e1', target }),
    ).resolves.toEqual({ missing: [] })

    expect(config.markSubmitted).toHaveBeenCalledWith('e1', 'contributor')
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      { entity: 'podcast_episode', entityId: 'e1', events: ['submit'] },
      expect.anything(),
    )
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'submission', entity: 'podcast_episode', entityId: 'e1' },
      expect.anything(),
    )
  })

  test('answers a conflict when nothing was written', async () => {
    const config = createConfig()
    config.markSubmitted.mockResolvedValue(0)

    await expect(
      createSubmissionHandlers(config).submit(request, { id: 'e1', target }),
    ).rejects.toMatchObject({ init: { status: 409 } })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('the author takes it back', async () => {
    const config = createConfig()
    config.loadSubmissionState.mockResolvedValue({ ...draft, submittedAt })

    await createSubmissionHandlers(config).withdraw(request, {
      id: 'e1',
      target,
    })

    expect(config.clearSubmission).toHaveBeenCalledWith('e1')
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      expect.objectContaining({ events: ['withdraw'] }),
      expect.anything(),
    )
  })

  test('the Coordinator returns it for edits, a Creator may not', async () => {
    const config = createConfig()
    config.loadSubmissionState.mockResolvedValue({ ...draft, submittedAt })
    const handlers = createSubmissionHandlers(config)

    signInAs('creator', 2)
    await expect(
      handlers.returnForEdits(request, { id: 'e1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(config.clearSubmission).not.toHaveBeenCalled()

    signInAs('coordinator', 1)
    await handlers.returnForEdits(request, { id: 'e1', target })
    expect(config.clearSubmission).toHaveBeenCalledWith('e1')
  })
})
