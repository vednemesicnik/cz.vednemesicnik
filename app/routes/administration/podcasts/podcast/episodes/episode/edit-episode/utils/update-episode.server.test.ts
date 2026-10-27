import { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateEpisode } from './update-episode.server'

// Mocked Prisma whose queued writes return tags, so the test sees what went
// into the transaction.
const mocks = vi.hoisted(() => ({
  checkAuthorPermission: vi.fn(),
  episodeFindUnique: vi.fn(),
  episodeUpdate: vi.fn(),
  episodeUpdateMany: vi.fn(),
  findPublishedEpisodeConflict: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  linkCreateMany: vi.fn(),
  linkDeleteMany: vi.fn(),
  recordEditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    podcastEpisode: {
      findUnique: mocks.episodeFindUnique,
      update: mocks.episodeUpdate,
      updateMany: mocks.episodeUpdateMany,
    },
    podcastEpisodeLink: {
      createMany: mocks.linkCreateMany,
      deleteMany: mocks.linkDeleteMany,
    },
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

vi.mock('../../../utils/find-published-episode-conflict.server', () => ({
  findPublishedEpisodeConflict: mocks.findPublishedEpisodeConflict,
}))

const request = new Request('https://test.local/')

const options = {
  description: 'Pan Kovář se stará o budovu dvacet let.',
  episodeId: 'episode-1',
  links: [{ label: 'Spotify', url: 'https://open.spotify.com/episode/1' }],
  number: 14,
  slug: 'skolnik-ktery-vi-vsechno',
  tabId: 'tab-1',
  title: 'Školník, který ví všechno',
} satisfies Parameters<typeof updateEpisode>[1]

// The saving tab holds the episode (log 0019).
const heldSince = new Date(Date.now() - 60_000)
const ownHold = {
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince,
  heldUntil: new Date(Date.now() + 60_000),
}

const savedAt = new Date('2026-10-27T12:06:00Z')

const storedEpisode = {
  authorId: 'author-1',
  firstContentAt: new Date('2026-10-27T10:00:00Z'),
  ...ownHold,
  number: 13,
  podcastId: 'podcast-1',
  state: 'draft',
  submittedAt: null,
}

const noConflict = {
  freeNumber: null,
  slugSuggestion: null,
  takenNumber: null,
  takenSlug: null,
}

// What the episode write sent as its data.
const savedData = () => mocks.episodeUpdate.mock.lastCall?.[0].data

// Each first save marks one row; later ones none.
const answerTransaction = (firstContentCount: number) =>
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-episode'
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
  mocks.findPublishedEpisodeConflict.mockResolvedValue(noConflict)
  mocks.episodeFindUnique.mockResolvedValue(storedEpisode)
  mocks.episodeUpdateMany.mockReturnValue('mark-first-content')
  mocks.episodeUpdate.mockReturnValue('update-episode')
  mocks.linkDeleteMany.mockReturnValue('delete-links')
  mocks.linkCreateMany.mockReturnValue('create-links')
  answerTransaction(0)
})

describe('updateEpisode — the save', () => {
  test('saves the fields from the holding tab and keeps the hold', async () => {
    expect(await updateEpisode(request, options)).toEqual({
      ...noConflict,
      status: 'saved',
      updatedAt: savedAt,
    })

    expect(savedData()).toEqual({
      authorId: 'author-1',
      description: 'Pan Kovář se stará o budovu dvacet let.',
      number: 14,
      slug: 'skolnik-ktery-vi-vsechno',
      title: 'Školník, který ví všechno',
    })
    expect(mocks.episodeUpdate.mock.lastCall?.[0].where).toEqual({
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      id: 'episode-1',
      state: 'draft',
    })
  })

  test('replaces the links as a set, in order, without the fully empty rows', async () => {
    await updateEpisode(request, {
      ...options,
      links: [
        { label: '', url: 'https://kabinet.example/13' },
        { label: '', url: '' },
        { label: 'Spotify', url: 'open.spotify/13' },
      ],
    })

    expect(mocks.transaction.mock.lastCall?.[0]).toEqual([
      'mark-first-content',
      'update-episode',
      'delete-links',
      'create-links',
    ])
    expect(mocks.linkDeleteMany).toHaveBeenCalledWith({
      where: { episodeId: 'episode-1' },
    })
    // An incomplete link saves as typed (2o0uwhgp).
    expect(mocks.linkCreateMany.mock.lastCall?.[0].data).toEqual([
      {
        episodeId: 'episode-1',
        label: '',
        order: 0,
        url: 'https://kabinet.example/13',
      },
      {
        episodeId: 'episode-1',
        label: 'Spotify',
        order: 1,
        url: 'open.spotify/13',
      },
    ])
  })

  test('gives a titled episode the title’s address when none is sent', async () => {
    await updateEpisode(request, { ...options, slug: '' })

    expect(savedData()).toMatchObject({ slug: 'skolnik-ktery-vi-vsechno' })
  })

  test('keeps the stored number when the editor sent one it could not read', async () => {
    await updateEpisode(request, { ...options, number: undefined })

    expect(savedData()).toMatchObject({ number: 13 })
  })

  test('clears a number the editor emptied', async () => {
    await updateEpisode(request, { ...options, number: null })

    expect(savedData()).toMatchObject({ number: null })
  })

  test('ends the hold with the save of a page going away', async () => {
    await updateEpisode(request, { ...options, releaseHold: true })

    expect(savedData()).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    })
  })
})

describe('updateEpisode — the empty draft (log 0020)', () => {
  const emptyDraft = { ...storedEpisode, firstContentAt: null }

  test('logs the creation with the first save with content', async () => {
    mocks.episodeFindUnique.mockResolvedValue(emptyDraft)
    answerTransaction(1)

    await updateEpisode(request, options)

    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      { authorId: 'author-1', roleLevel: 3 },
      {
        entity: 'podcast_episode',
        entityId: 'episode-1',
        heldSince,
        isCreation: true,
      },
    )
  })

  test('stays empty, with no history, while only its number changes', async () => {
    mocks.episodeFindUnique.mockResolvedValue(emptyDraft)

    await updateEpisode(request, {
      ...options,
      description: '',
      links: [{ label: '', url: '' }],
      slug: '',
      title: '',
    })

    expect(mocks.episodeUpdateMany).not.toHaveBeenCalled()
    expect(mocks.transaction.mock.lastCall?.[0]).toEqual([
      'update-episode',
      'delete-links',
      'create-links',
    ])
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })

  test('logs an edit after the first save', async () => {
    await updateEpisode(request, options)

    expect(mocks.recordEditLog.mock.lastCall?.[1].isCreation).toBe(false)
  })
})

describe('updateEpisode — taken values save and are reported (27f)', () => {
  test('answers the taken number and address with free ones', async () => {
    const conflict = {
      freeNumber: 15,
      slugSuggestion: 'skolnik-ktery-vi-vsechno-2',
      takenNumber: 14,
      takenSlug: 'skolnik-ktery-vi-vsechno',
    }
    mocks.findPublishedEpisodeConflict.mockResolvedValue(conflict)

    expect(await updateEpisode(request, options)).toEqual({
      ...conflict,
      status: 'saved',
      updatedAt: savedAt,
    })
    expect(savedData()).toMatchObject({
      number: 14,
      slug: 'skolnik-ktery-vi-vsechno',
    })
    expect(mocks.findPublishedEpisodeConflict).toHaveBeenCalledWith({
      episodeId: 'episode-1',
      number: 14,
      podcastId: 'podcast-1',
      slug: 'skolnik-ktery-vi-vsechno',
    })
  })
})

describe('updateEpisode — who may save', () => {
  test('refuses another tab and says who holds it', async () => {
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
    })

    expect(await updateEpisode(request, options)).toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('deleted between the check and the write: answers deleted (0036)', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.episodeFindUnique
      .mockResolvedValueOnce(storedEpisode)
      .mockResolvedValueOnce(null)

    expect(await updateEpisode(request, options)).toEqual({
      status: 'deleted',
    })
  })

  test('the hold moved between the check and the write: not held', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.episodeFindUnique.mockResolvedValueOnce(storedEpisode)
    mocks.episodeFindUnique.mockResolvedValueOnce({
      ...ownHold,
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
    })

    expect(await updateEpisode(request, options)).toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
  })

  test("refuses a Creator's other author", async () => {
    await expect(
      updateEpisode(request, { ...options, authorId: 'author-2' }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('lets the Coordinator choose the author', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue({
      authorId: 'author-1',
      roleLevel: 1,
    })

    await updateEpisode(request, { ...options, authorId: 'author-2' })

    expect(savedData()).toMatchObject({ authorId: 'author-2' })
    expect(mocks.checkAuthorPermission).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ targetAuthorIds: ['author-2'] }),
    )
  })

  test('refuses an edit the stored episode does not allow', async () => {
    mocks.checkAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(updateEpisode(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
  })

  test('refuses an author their submitted episode', async () => {
    mocks.episodeFindUnique.mockResolvedValue({
      ...storedEpisode,
      submittedAt: new Date(),
    })

    await expect(updateEpisode(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
  })

  test('answers a missing episode as deleted (0036)', async () => {
    mocks.episodeFindUnique.mockResolvedValue(null)

    await expect(updateEpisode(request, options)).resolves.toEqual({
      status: 'deleted',
    })
  })
})
