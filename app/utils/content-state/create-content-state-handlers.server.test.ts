import { describe, expect, test, vi } from 'vitest'

import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  type ContentStateHandlersConfig,
  clearReviewsOnDraft,
  createContentStateHandlers,
  type PermissionTarget,
  type StateTransitionData,
} from './create-content-state-handlers.server'
import { createMissingContentError } from './create-missing-content-error'

// Replace the permission wrapper with a pass-through that runs `execute` with a
// caller-controlled context, so these tests exercise the factory's own logic
// (review gate, auto-approve, publish-date resolution) without real auth.
const { withAuthorPermissionMock } = vi.hoisted(() => ({
  withAuthorPermissionMock: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (request: Request, options: unknown) =>
      withAuthorPermissionMock(request, options),
  }),
)

const { publishContentEventMock } = vi.hoisted(() => ({
  publishContentEventMock: vi.fn(),
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: publishContentEventMock,
}))

const { deleteContentLogMock, recordContentLogMock } = vi.hoisted(() => ({
  deleteContentLogMock: vi.fn().mockResolvedValue(undefined),
  recordContentLogMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: recordContentLogMock,
}))

vi.mock('~/utils/content-log/delete-content-log.server', () => ({
  deleteContentLog: deleteContentLogMock,
}))

const request = new Request('https://test.local/')
const target: PermissionTarget = { authorIds: ['author-1'], state: 'draft' }

type WrapperOptions = {
  action: string
  entity: string
  target: PermissionTarget
  execute: (context: AuthorPermissionContext) => Promise<unknown>
}

// Route the mocked wrapper's `execute` through a fixed permission context. The
// real withAuthorPermission is async, so wrap here too — a synchronous throw
// inside `execute` must surface as a rejected promise, not a sync throw.
const runAs = (roleLevel: number, authorId = 'author-1') => {
  withAuthorPermissionMock.mockImplementation(
    async (_request: Request, options: WrapperOptions) =>
      options.execute({
        authorId,
        authorName: 'Marie Horáková',
        can: vi.fn(),
        permissions: [],
        roleLevel,
        roleName: 'tester',
      } as unknown as AuthorPermissionContext),
  )
}

// Last options object forwarded to the permission wrapper (action/entity/target).
const lastWrapperOptions = (): WrapperOptions =>
  withAuthorPermissionMock.mock.calls.at(-1)?.[1] as WrapperOptions

const createConfig = (
  overrides: Partial<ContentStateHandlersConfig> = {},
): ContentStateHandlersConfig => ({
  applyState: vi.fn().mockResolvedValue(undefined),
  deleteRow: vi.fn().mockResolvedValue(undefined),
  ensureApprovingReview: vi.fn().mockResolvedValue(undefined),
  entity: 'article',
  loadPublishState: vi
    .fn()
    .mockResolvedValue({ authors: [], publishedAt: null, reviews: [] }),
  ...overrides,
})

const APPROVER = 1
const CONTRIBUTOR = 3

// Approval reads a submitted text (07c), so the review handler needs one.
const submittedConfig = (overrides: Partial<ContentStateHandlersConfig> = {}) =>
  createConfig({
    loadPublishState: vi.fn().mockResolvedValue({
      authors: [],
      publishedAt: null,
      reviews: [],
      submittedAt: new Date('2026-10-13T10:00:00Z'),
    }),
    ...overrides,
  })

const configFor = (handler: string) =>
  handler === 'review' ? submittedConfig() : createConfig()

describe('createContentStateHandlers — review gate', () => {
  test('blocks publish when content still needs an approving review', async () => {
    const config = createConfig({
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: CONTRIBUTOR } }],
        publishedAt: null,
        reviews: [],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    const rejection = handlers.publish(request, { id: 'a1', target })

    await expect(rejection).rejects.toBeInstanceOf(Response)
    await expect(rejection).rejects.toHaveProperty('status', 400)
    expect(config.applyState).not.toHaveBeenCalled()
  })

  test('allows publish when an approver-level review exists', async () => {
    const config = createConfig({
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: CONTRIBUTOR } }],
        publishedAt: null,
        reviews: [{ reviewer: { role: { level: APPROVER } } }],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    await handlers.publish(request, { id: 'a1', target })

    expect(config.applyState).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ state: 'published' }),
      'author-1',
    )
    // A contributor publishing does not create a review.
    expect(config.ensureApprovingReview).not.toHaveBeenCalled()
  })

  test('blocks an approver without a review unless the entity lets them publish directly', async () => {
    const loadPublishState = vi.fn().mockResolvedValue({
      authors: [{ role: { level: CONTRIBUTOR } }],
      publishedAt: null,
      reviews: [],
    })
    runAs(APPROVER, 'coordinator-1')

    const gated = createContentStateHandlers(createConfig({ loadPublishState }))
    await expect(
      gated.publish(request, { id: 'a1', target }),
    ).rejects.toHaveProperty('status', 400)

    const direct = createConfig({
      approverPublishesWithoutReview: true,
      loadPublishState,
    })
    await createContentStateHandlers(direct).publish(request, {
      id: 'a1',
      target,
    })
    expect(direct.applyState).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ state: 'published' }),
      'coordinator-1',
    )
    // The publishing act is the approval.
    expect(direct.ensureApprovingReview).toHaveBeenCalledWith(
      'a1',
      'coordinator-1',
    )
  })

  test('a lower role still needs a review even when approvers publish directly', async () => {
    const config = createConfig({
      approverPublishesWithoutReview: true,
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: CONTRIBUTOR } }],
        publishedAt: null,
        reviews: [],
      }),
    })
    runAs(CONTRIBUTOR)

    await expect(
      createContentStateHandlers(config).publish(request, { id: 'a1', target }),
    ).rejects.toHaveProperty('status', 400)
    expect(config.applyState).not.toHaveBeenCalled()
  })
})

describe('createContentStateHandlers — completeness (23h)', () => {
  const loadPublishState = vi.fn().mockResolvedValue({
    authors: [{ role: { level: APPROVER } }],
    publishedAt: null,
    reviews: [],
  })

  test('an incomplete entity is not published and says what is missing', async () => {
    const config = createConfig({
      getMissingBeforePublish: vi.fn().mockResolvedValue(['Chybí perex.']),
      loadPublishState,
    })
    runAs(APPROVER)

    const result = await createContentStateHandlers(config).publish(request, {
      id: 'a1',
      target,
    })

    expect(result).toEqual({ missing: ['Chybí perex.'] })
    expect(config.applyState).not.toHaveBeenCalled()
    expect(config.ensureApprovingReview).not.toHaveBeenCalled()
  })

  test('missing content the write finds blocks it the same way (log 0039)', async () => {
    const config = createConfig({
      applyState: vi
        .fn()
        .mockRejectedValue(createMissingContentError(['Adresa je obsazená.'])),
      loadPublishState,
    })
    runAs(APPROVER)

    recordContentLogMock.mockClear()

    const result = await createContentStateHandlers(config).publish(request, {
      id: 'a1',
      target,
    })

    expect(result).toEqual({ missing: ['Adresa je obsazená.'] })
    expect(config.ensureApprovingReview).not.toHaveBeenCalled()
    expect(recordContentLogMock).not.toHaveBeenCalled()
  })

  test('any other failure of the write still fails the publish', async () => {
    const config = createConfig({
      applyState: vi.fn().mockRejectedValue(new Error('Database down')),
      loadPublishState,
    })
    runAs(APPROVER)

    await expect(
      createContentStateHandlers(config).publish(request, { id: 'a1', target }),
    ).rejects.toThrow('Database down')
  })

  test('an entity without the check publishes as before', async () => {
    const config = createConfig({ loadPublishState })
    runAs(APPROVER)

    const result = await createContentStateHandlers(config).publish(request, {
      id: 'a1',
      target,
    })

    expect(result).toEqual({ missing: [] })
    expect(config.applyState).toHaveBeenCalled()
  })
})

describe('createContentStateHandlers — approver auto-approve', () => {
  test('records an approving review when an approver publishes', async () => {
    const config = createConfig({
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: APPROVER } }],
        publishedAt: null,
        reviews: [],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER, 'coordinator-1')

    await handlers.publish(request, { id: 'a1', target })

    expect(config.ensureApprovingReview).toHaveBeenCalledWith(
      'a1',
      'coordinator-1',
    )
  })
})

describe('createContentStateHandlers — publish date', () => {
  test('preserves the stored date on re-publish', async () => {
    const existing = new Date('2024-01-01T00:00:00.000Z')
    const config = createConfig({
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: APPROVER } }],
        publishedAt: existing,
        reviews: [],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER)

    await handlers.publish(request, { id: 'a1', target })

    expect(config.applyState).toHaveBeenCalledWith(
      'a1',
      { publishedAt: existing, state: 'published' },
      'author-1',
    )
  })

  test('defaults to now on the first publish (no stored date)', async () => {
    const config = createConfig({
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: APPROVER } }],
        publishedAt: null,
        reviews: [],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER)

    await handlers.publish(request, { id: 'a1', target })

    const data = vi.mocked(config.applyState).mock.calls[0][1]
    expect(data.publishedAt).toBeInstanceOf(Date)
    expect(data.publishedAt?.getTime()).toBeGreaterThan(Date.now() - 5000)
  })

  test('ignores a client backdate when backdating is not allowed', async () => {
    const backdate = new Date('2020-01-01T00:00:00.000Z')
    const config = createConfig({
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: APPROVER } }],
        publishedAt: null,
        reviews: [],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER)

    await handlers.publish(request, {
      id: 'a1',
      publishedAt: backdate,
      target,
    })

    const data = vi.mocked(config.applyState).mock.calls[0][1]
    expect(data.publishedAt).not.toEqual(backdate)
  })

  test('uses an approver backdate when backdating is allowed', async () => {
    const backdate = new Date('2024-06-01T00:00:00.000Z')
    const config = createConfig({
      allowBackdating: true,
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: APPROVER } }],
        publishedAt: null,
        reviews: [],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER)

    await handlers.publish(request, {
      id: 'a1',
      publishedAt: backdate,
      target,
    })

    expect(config.applyState).toHaveBeenCalledWith(
      'a1',
      { publishedAt: backdate, state: 'published' },
      'author-1',
    )
  })

  test('rejects a backdate from a non-approver', async () => {
    const backdate = new Date('2024-06-01T00:00:00.000Z')
    const config = createConfig({
      allowBackdating: true,
      loadPublishState: vi.fn().mockResolvedValue({
        authors: [{ role: { level: CONTRIBUTOR } }],
        publishedAt: null,
        reviews: [{ reviewer: { role: { level: APPROVER } } }],
      }),
    })
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    const rejection = handlers.publish(request, {
      id: 'a1',
      publishedAt: backdate,
      target,
    })

    await expect(rejection).rejects.toHaveProperty('status', 403)
    expect(config.applyState).not.toHaveBeenCalled()
  })
})

describe('createContentStateHandlers — transition matrix', () => {
  test('retract moves to draft and keeps the publish date', async () => {
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    await handlers.retract(request, { id: 'a1', target })

    const data: StateTransitionData = vi.mocked(config.applyState).mock
      .calls[0][1]
    expect(data).toEqual({ state: 'draft' })
    expect(data).not.toHaveProperty('publishedAt')
    expect(lastWrapperOptions().action).toBe('retract')
  })

  test('archive changes state only', async () => {
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    await handlers.archive(request, { id: 'a1', target })

    expect(config.applyState).toHaveBeenCalledWith(
      'a1',
      { state: 'archived' },
      'author-1',
    )
  })

  test('restore moves to draft and keeps the publish date', async () => {
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    await handlers.restore(request, { id: 'a1', target })

    const data: StateTransitionData = vi.mocked(config.applyState).mock
      .calls[0][1]
    expect(data).toEqual({ state: 'draft' })
    expect(data).not.toHaveProperty('publishedAt')
  })

  test('review records an approving review by the current author', async () => {
    const config = submittedConfig()
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER, 'reviewer-9')

    await handlers.review(request, { id: 'a1', target })

    expect(config.ensureApprovingReview).toHaveBeenCalledWith(
      'a1',
      'reviewer-9',
    )
  })

  test('review of an incomplete text approves nothing and says what is missing', async () => {
    const config = submittedConfig()
    config.getMissingBeforePublish = vi
      .fn()
      .mockResolvedValue(['Adresa je obsazená.'])
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER, 'reviewer-9')
    publishContentEventMock.mockClear()

    await expect(
      handlers.review(request, { id: 'a1', target }),
    ).resolves.toEqual({ missing: ['Adresa je obsazená.'] })
    expect(config.ensureApprovingReview).not.toHaveBeenCalled()
    expect(publishContentEventMock).not.toHaveBeenCalled()
  })

  test('review refuses a draft nobody submitted', async () => {
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER, 'reviewer-9')

    await expect(
      handlers.review(request, { id: 'a1', target }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(config.ensureApprovingReview).not.toHaveBeenCalled()
  })

  test('delete delegates to the entity delete callback', async () => {
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    await handlers.delete(request, { id: 'a1', target })

    expect(config.deleteRow).toHaveBeenCalledWith('a1', expect.anything())
    expect(lastWrapperOptions().action).toBe('delete')
  })

  test('changePublishedAt writes the date for an approver', async () => {
    const nextDate = new Date('2024-03-03T00:00:00.000Z')
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER)

    await handlers.changePublishedAt(request, {
      id: 'a1',
      publishedAt: nextDate,
      target,
    })

    expect(config.applyState).toHaveBeenCalledWith(
      'a1',
      { publishedAt: nextDate },
      'author-1',
    )
  })

  test('changePublishedAt is rejected for a non-approver', async () => {
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    const rejection = handlers.changePublishedAt(request, {
      id: 'a1',
      publishedAt: new Date('2024-03-03T00:00:00.000Z'),
      target,
    })

    await expect(rejection).rejects.toHaveProperty('status', 403)
    expect(config.applyState).not.toHaveBeenCalled()
  })
})

describe('createContentStateHandlers — permission wiring', () => {
  test('forwards the entity and target to the permission wrapper', async () => {
    const config = createConfig({ entity: 'article' })
    const handlers = createContentStateHandlers(config)
    runAs(CONTRIBUTOR)

    await handlers.archive(request, { id: 'a1', target })

    const options = lastWrapperOptions()
    expect(options.entity).toBe('article')
    expect(options.action).toBe('archive')
    expect(options.target).toEqual(target)
  })
})

describe('createContentStateHandlers — content events', () => {
  test.each([
    ['archive', 'archive'],
    ['delete', 'delete'],
    ['restore', 'restore'],
    ['retract', 'retract'],
    ['review', 'review'],
  ] as const)('a successful %s announces "%s"', async (handler, change) => {
    runAs(APPROVER)
    publishContentEventMock.mockClear()
    const handlers = createContentStateHandlers(configFor(handler))

    await handlers[handler](request, { id: 'a1', target })

    expect(publishContentEventMock).toHaveBeenCalledExactlyOnceWith(
      { change, entity: 'article', entityId: 'a1' },
      expect.objectContaining({
        authorId: 'author-1',
        authorName: 'Marie Horáková',
      }),
    )
  })

  test('publish and a publish-date change announce themselves', async () => {
    runAs(APPROVER)
    publishContentEventMock.mockClear()
    const handlers = createContentStateHandlers(
      createConfig({
        allowBackdating: true,
        approverPublishesWithoutReview: true,
        entity: 'issue',
      }),
    )

    await handlers.publish(request, { id: 'i1', target })
    await handlers.changePublishedAt(request, {
      id: 'i1',
      publishedAt: new Date('2020-01-01'),
      target,
    })

    expect(publishContentEventMock.mock.calls.map(([event]) => event)).toEqual([
      { change: 'publish', entity: 'issue', entityId: 'i1' },
      { change: 'change-published-at', entity: 'issue', entityId: 'i1' },
    ])
  })

  test('a publish blocked by missing content announces nothing', async () => {
    runAs(APPROVER)
    publishContentEventMock.mockClear()
    const handlers = createContentStateHandlers(
      createConfig({
        approverPublishesWithoutReview: true,
        getMissingBeforePublish: vi.fn().mockResolvedValue(['Chybí perex.']),
      }),
    )

    await handlers.publish(request, { id: 'a1', target })

    expect(publishContentEventMock).not.toHaveBeenCalled()
  })

  test('a failed transition announces nothing', async () => {
    runAs(APPROVER)
    publishContentEventMock.mockClear()
    const handlers = createContentStateHandlers(
      createConfig({
        applyState: vi.fn().mockRejectedValue(new Error('database down')),
      }),
    )

    await expect(
      handlers.archive(request, { id: 'a1', target }),
    ).rejects.toThrow('database down')

    expect(publishContentEventMock).not.toHaveBeenCalled()
  })
})

describe('createContentStateHandlers — content log (07f)', () => {
  const loggedEvents = () =>
    recordContentLogMock.mock.calls.map(([record]) => record.events)

  test.each([
    ['archive', 'archive'],
    ['restore', 'restore'],
    ['retract', 'unpublish'],
    ['review', 'approve'],
  ] as const)(
    'a successful %s writes "%s" with its actor',
    async (handler, event) => {
      runAs(APPROVER)
      recordContentLogMock.mockClear()
      const handlers = createContentStateHandlers(configFor(handler))

      await handlers[handler](request, { id: 'a1', target })

      expect(recordContentLogMock).toHaveBeenCalledExactlyOnceWith(
        {
          detail: undefined,
          entity: 'article',
          entityId: 'a1',
          events: [event],
        },
        expect.objectContaining({ authorId: 'author-1' }),
      )
    },
  )

  test('an approver publishing a submitted, unapproved text writes approve and publish in one step', async () => {
    runAs(APPROVER)
    recordContentLogMock.mockClear()
    const handlers = createContentStateHandlers(
      createConfig({
        approverPublishesWithoutReview: true,
        loadPublishState: vi.fn().mockResolvedValue({
          authors: [{ role: { level: CONTRIBUTOR } }],
          publishedAt: null,
          reviews: [],
          submittedAt: new Date('2026-09-19'),
        }),
      }),
    )

    await handlers.publish(request, { id: 'a1', target })

    expect(loggedEvents()).toEqual([['approve', 'publish']])
  })

  test.each([
    ['an unsubmitted draft', null, []],
    [
      'an already approved text',
      new Date('2026-09-19'),
      [{ reviewer: { role: { level: APPROVER } } }],
    ],
  ])(
    'an approver publishing %s writes publish only',
    async (_case, submittedAt, reviews) => {
      runAs(APPROVER)
      recordContentLogMock.mockClear()
      const handlers = createContentStateHandlers(
        createConfig({
          approverPublishesWithoutReview: true,
          loadPublishState: vi.fn().mockResolvedValue({
            authors: [{ role: { level: CONTRIBUTOR } }],
            publishedAt: null,
            reviews,
            submittedAt,
          }),
        }),
      )

      await handlers.publish(request, { id: 'a1', target })

      expect(loggedEvents()).toEqual([['publish']])
    },
  )

  test('a publish-date change writes the old and the new date', async () => {
    runAs(APPROVER)
    recordContentLogMock.mockClear()
    const handlers = createContentStateHandlers(
      createConfig({
        loadPublishState: vi.fn().mockResolvedValue({
          authors: [],
          publishedAt: new Date('2026-09-19T08:00:00.000Z'),
          reviews: [],
        }),
      }),
    )

    await handlers.changePublishedAt(request, {
      id: 'a1',
      publishedAt: new Date('2026-09-18T08:00:00.000Z'),
      target,
    })

    expect(recordContentLogMock).toHaveBeenCalledExactlyOnceWith(
      {
        detail: '2026-09-19T08:00:00.000Z → 2026-09-18T08:00:00.000Z',
        entity: 'article',
        entityId: 'a1',
        events: ['set_published_at'],
      },
      expect.anything(),
    )
  })

  test('delete removes the history and writes nothing', async () => {
    runAs(APPROVER)
    recordContentLogMock.mockClear()
    deleteContentLogMock.mockClear()
    const handlers = createContentStateHandlers(createConfig())

    await handlers.delete(request, { id: 'a1', target })

    expect(deleteContentLogMock).toHaveBeenCalledExactlyOnceWith({
      entity: 'article',
      entityId: 'a1',
    })
    expect(recordContentLogMock).not.toHaveBeenCalled()
  })

  test('a blocked, forbidden or failed transition writes nothing', async () => {
    recordContentLogMock.mockClear()

    runAs(APPROVER)
    await createContentStateHandlers(
      createConfig({
        approverPublishesWithoutReview: true,
        getMissingBeforePublish: vi.fn().mockResolvedValue(['Chybí perex.']),
      }),
    ).publish(request, { id: 'a1', target })

    runAs(CONTRIBUTOR)
    await expect(
      createContentStateHandlers(
        createConfig({
          loadPublishState: vi.fn().mockResolvedValue({
            authors: [{ role: { level: CONTRIBUTOR } }],
            publishedAt: null,
            reviews: [],
          }),
        }),
      ).publish(request, { id: 'a1', target }),
    ).rejects.toBeInstanceOf(Response)

    runAs(APPROVER)
    await expect(
      createContentStateHandlers(
        createConfig({
          applyState: vi.fn().mockRejectedValue(new Error('database down')),
        }),
      ).archive(request, { id: 'a1', target }),
    ).rejects.toThrow('database down')

    expect(recordContentLogMock).not.toHaveBeenCalled()
  })

  test('page SEO keeps no history', async () => {
    runAs(APPROVER)
    recordContentLogMock.mockClear()
    const handlers = createContentStateHandlers(
      createConfig({ entity: 'page_seo' }),
    )

    await handlers.archive(request, { id: 'p1', target })

    expect(recordContentLogMock).not.toHaveBeenCalled()
  })
})

describe('clearReviewsOnDraft', () => {
  test('adds a review wipe when the transition targets draft', () => {
    expect(clearReviewsOnDraft({ publishedAt: null, state: 'draft' })).toEqual({
      publishedAt: null,
      reviews: { deleteMany: {} },
      state: 'draft',
    })
  })

  test('leaves non-draft transitions untouched', () => {
    expect(clearReviewsOnDraft({ state: 'archived' })).toEqual({
      state: 'archived',
    })
    const publishedData = {
      publishedAt: new Date(0),
      state: 'published' as const,
    }
    expect(clearReviewsOnDraft(publishedData)).not.toHaveProperty('reviews')
  })
})
