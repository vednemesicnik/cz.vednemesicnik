import { describe, expect, test, vi } from 'vitest'

import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import {
  type ContentStateHandlersConfig,
  clearReviewsOnDraft,
  createContentStateHandlers,
  type PermissionTarget,
  type StateTransitionData,
} from './create-content-state-handlers.server'

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
    )
    // A contributor publishing does not create a review.
    expect(config.ensureApprovingReview).not.toHaveBeenCalled()
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

    expect(config.applyState).toHaveBeenCalledWith('a1', {
      publishedAt: existing,
      state: 'published',
    })
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

    expect(config.applyState).toHaveBeenCalledWith('a1', {
      publishedAt: backdate,
      state: 'published',
    })
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

    expect(config.applyState).toHaveBeenCalledWith('a1', { state: 'archived' })
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
    const config = createConfig()
    const handlers = createContentStateHandlers(config)
    runAs(APPROVER, 'reviewer-9')

    await handlers.review(request, { id: 'a1', target })

    expect(config.ensureApprovingReview).toHaveBeenCalledWith(
      'a1',
      'reviewer-9',
    )
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

    expect(config.applyState).toHaveBeenCalledWith('a1', {
      publishedAt: nextDate,
    })
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
