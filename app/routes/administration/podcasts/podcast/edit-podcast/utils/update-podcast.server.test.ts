import { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updatePodcast } from './update-podcast.server'

// Mocked Prisma whose queued writes return tags, so the test sees what went
// into the transaction.
const mocks = vi.hoisted(() => ({
  checkAuthorPermission: vi.fn(),
  coverUpdateMany: vi.fn(),
  findPublishedPodcastConflict: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  podcastFindUnique: vi.fn(),
  podcastUpdate: vi.fn(),
  podcastUpdateMany: vi.fn(),
  recordEditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    podcast: {
      findUnique: mocks.podcastFindUnique,
      update: mocks.podcastUpdate,
      updateMany: mocks.podcastUpdateMany,
    },
    podcastCover: { updateMany: mocks.coverUpdateMany },
  },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: mocks.getAuthorPermissionContext }),
)

vi.mock(
  '~/utils/permissions/author/guards/check-author-permission.server',
  () => ({ checkAuthorPermission: mocks.checkAuthorPermission }),
)

vi.mock('~/utils/content-log/record-edit-log.server', () => ({
  recordEditLog: mocks.recordEditLog,
}))

vi.mock('../../../utils/find-published-podcast-conflict.server', () => ({
  findPublishedPodcastConflict: mocks.findPublishedPodcastConflict,
}))

const request = new Request('https://test.local/')

const options = {
  description: 'O škole a lidech v ní.',
  podcastId: 'podcast-1',
  slug: 'prestavka',
  tabId: 'tab-1',
  title: 'Přestávka',
} satisfies Parameters<typeof updatePodcast>[1]

// The saving tab holds the podcast (log 0019).
const heldSince = new Date(Date.now() - 60_000)
const ownHold = {
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince,
  heldUntil: new Date(Date.now() + 60_000),
}

const savedAt = new Date('2026-10-28T12:06:00Z')

const storedPodcast = {
  authorId: 'author-1',
  cover: null,
  firstContentAt: new Date('2026-10-28T10:00:00Z'),
  ...ownHold,
  state: 'draft',
  submittedAt: null,
}

const noConflict = { slugSuggestion: null, takenSlug: null }

// What the podcast write sent as its data.
const savedData = () => mocks.podcastUpdate.mock.lastCall?.[0].data

// Each first save marks one row; later ones none.
const answerTransaction = (firstContentCount: number) =>
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-podcast'
        ? { updatedAt: savedAt }
        : { count: firstContentCount },
    ),
  )

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAuthorPermissionContext.mockResolvedValue({
    authorId: 'author-1',
    roleLevel: 3,
  })
  // clearAllMocks keeps implementations; a test's denial must not leak.
  mocks.checkAuthorPermission.mockReset()
  mocks.findPublishedPodcastConflict.mockResolvedValue(noConflict)
  mocks.podcastFindUnique.mockResolvedValue(storedPodcast)
  mocks.podcastUpdateMany.mockReturnValue('mark-first-content')
  mocks.podcastUpdate.mockReturnValue('update-podcast')
  mocks.coverUpdateMany.mockReturnValue('update-cover-alt-text')
  answerTransaction(0)
})

describe('updatePodcast — the save', () => {
  test('saves the fields from the holding tab and keeps the hold', async () => {
    expect(await updatePodcast(request, options)).toEqual({
      ...noConflict,
      status: 'saved',
      updatedAt: savedAt,
    })

    expect(mocks.podcastUpdate).toHaveBeenCalledWith({
      data: {
        authorId: 'author-1',
        description: 'O škole a lidech v ní.',
        slug: 'prestavka',
        title: 'Přestávka',
      },
      select: { updatedAt: true },
      where: expect.objectContaining({ id: 'podcast-1', state: 'draft' }),
    })
  })

  test('an empty address stays empty (27i)', async () => {
    await updatePodcast(request, { ...options, slug: '' })

    expect(savedData()).toMatchObject({ slug: '' })
  })

  test('the save of a page going away ends the hold', async () => {
    await updatePodcast(request, { ...options, releaseHold: true })

    expect(savedData()).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    })
  })

  test('the cover’s alt text follows the title', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      cover: { id: 'cover-1' },
    })

    await updatePodcast(request, options)

    expect(mocks.coverUpdateMany).toHaveBeenCalledWith({
      data: { altText: 'Obálka podcastu Přestávka' },
      where: { podcastId: 'podcast-1' },
    })
  })

  test('answers a taken address with a free one (27e)', async () => {
    mocks.findPublishedPodcastConflict.mockResolvedValue({
      slugSuggestion: 'prestavka-2',
      takenSlug: 'prestavka',
    })

    expect(await updatePodcast(request, options)).toMatchObject({
      slugSuggestion: 'prestavka-2',
      status: 'saved',
      takenSlug: 'prestavka',
    })
  })
})

describe('updatePodcast — the empty draft (log 0020)', () => {
  const emptyDraft = { ...storedPodcast, firstContentAt: null }

  test('the first save with a title is its creation', async () => {
    mocks.podcastFindUnique.mockResolvedValue(emptyDraft)
    answerTransaction(1)

    await updatePodcast(request, options)

    expect(mocks.podcastUpdateMany).toHaveBeenCalledWith({
      data: { firstContentAt: expect.any(Date) },
      where: { firstContentAt: null, id: 'podcast-1' },
    })
    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entity: 'podcast', isCreation: true }),
    )
  })

  test('an address alone is no content and leaves no history', async () => {
    mocks.podcastFindUnique.mockResolvedValue(emptyDraft)

    await updatePodcast(request, {
      ...options,
      description: '',
      title: '',
    })

    expect(mocks.podcastUpdateMany).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })
})

describe('updatePodcast — the edit hold (logs 0019, 0036)', () => {
  test('writes nothing for a tab that does not hold the podcast', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
    })

    expect(await updatePodcast(request, options)).toEqual({
      heldByName: 'Marie Horáková',
      status: 'not-held',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('answers deleted for a podcast that is gone', async () => {
    mocks.podcastFindUnique.mockResolvedValue(null)

    expect(await updatePodcast(request, options)).toEqual({
      status: 'deleted',
    })
  })

  test('answers deleted when it went between the check and the write', async () => {
    mocks.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.podcastFindUnique
      .mockResolvedValueOnce(storedPodcast)
      .mockResolvedValueOnce(null)

    expect(await updatePodcast(request, options)).toEqual({
      status: 'deleted',
    })
  })
})

describe('updatePodcast — the author (27e)', () => {
  test('refuses another author from anyone but the Coordinator', async () => {
    await expect(
      updatePodcast(request, { ...options, authorId: 'author-2' }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('the Coordinator sets another author', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue({
      authorId: 'author-1',
      roleLevel: 1,
    })

    await updatePodcast(request, { ...options, authorId: 'author-2' })

    expect(savedData()).toMatchObject({ authorId: 'author-2' })
  })

  test('a submitted podcast is locked for its author (07d)', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      ...storedPodcast,
      submittedAt: new Date('2026-10-28T11:00:00Z'),
    })

    await expect(updatePodcast(request, options)).rejects.toMatchObject(
      data(null, { status: 403 }),
    )
  })
})
