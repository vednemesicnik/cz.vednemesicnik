import { beforeEach, describe, expect, test, vi } from 'vitest'

import { middleware } from './_middleware'

const mocks = vi.hoisted(() => ({
  getStream: vi.fn(),
  issuePdfFindFirst: vi.fn(),
  issuePdfFindUnique: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    issuePDF: {
      findFirst: mocks.issuePdfFindFirst,
      findUnique: mocks.issuePdfFindUnique,
    },
  },
}))

vi.mock('~/utils/pdf-store/pdf-store.server', () => ({
  pdfStore: { getStream: mocks.getStream },
}))

// A previewer who may see drafts: the clause is a marker the test follows.
const VISIBLE = { OR: [{ state: 'published' }, { state: 'draft' }] }
// An anonymous visitor sees only what is published.
const PUBLISHED_ONLY = { OR: [{ state: 'published' }] }
const visibilityMock = vi.hoisted(() => ({ where: vi.fn() }))
vi.mock('~/utils/permissions/author/get-web-content-visibility.server', () => ({
  getWebContentVisibility: async () => visibilityMock,
  ownByAuthor: (authorId: string) => ({ authorId }),
}))

const pdf = {
  contentType: 'application/pdf',
  id: 'pdf-1',
  updatedAt: new Date('2026-10-23T10:00:00Z'),
}

const serve = async (fileName: string, search = '') => {
  const next = vi.fn(async () => new Response('not found', { status: 404 }))
  const response = await middleware[0](
    {
      params: { fileName },
      request: new Request(`https://test.local/archive/${fileName}${search}`),
    } as never,
    next,
  )
  return { next, response: response as Response }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.issuePdfFindUnique.mockResolvedValue(null)
  mocks.issuePdfFindFirst.mockResolvedValue(null)
  mocks.getStream.mockResolvedValue(new ReadableStream())
  visibilityMock.where.mockReturnValue(VISIBLE)
})

describe('the issue PDF middleware', () => {
  test('serves a PDF by its name', async () => {
    mocks.issuePdfFindUnique.mockResolvedValue(pdf)

    const { response } = await serve('VDM-2026-4.pdf')

    expect(response.status).toBe(200)
    expect(mocks.issuePdfFindUnique.mock.lastCall?.[0].where).toEqual({
      fileName: 'VDM-2026-4.pdf',
      issue: VISIBLE,
    })
    expect(mocks.issuePdfFindFirst).not.toHaveBeenCalled()
  })

  test("finds a draft's PDF at its provisional address (log 0039)", async () => {
    mocks.issuePdfFindFirst.mockResolvedValue(pdf)

    const { response } = await serve('VDM-2026-2-maturitni-ples.pdf')

    expect(response.status).toBe(200)
    expect(mocks.issuePdfFindFirst.mock.lastCall?.[0].where).toEqual({
      issue: {
        AND: [
          VISIBLE,
          {
            order: 2,
            state: 'draft',
            supplementSlug: 'maturitni-ples',
            year: 2026,
          },
        ],
      },
    })
  })

  test('names the draft by its id among those sharing the number', async () => {
    mocks.issuePdfFindFirst.mockResolvedValue(pdf)

    await serve('VDM-2026-4.pdf', '?id=issue-7')

    expect(mocks.issuePdfFindUnique.mock.lastCall?.[0].where.issue).toEqual({
      ...VISIBLE,
      id: 'issue-7',
    })
    expect(
      mocks.issuePdfFindFirst.mock.lastCall?.[0].where.issue.AND[0],
    ).toEqual({ ...VISIBLE, id: 'issue-7' })
  })

  test('an anonymous visitor looks for a draft only among published issues', async () => {
    visibilityMock.where.mockReturnValue(PUBLISHED_ONLY)

    await serve('VDM-2026-4.pdf')

    // Published only, and a draft: a clause nothing matches.
    expect(mocks.issuePdfFindFirst.mock.lastCall?.[0].where).toEqual({
      issue: {
        AND: [
          PUBLISHED_ONLY,
          { order: 4, state: 'draft', supplementSlug: '', year: 2026 },
        ],
      },
    })
  })

  test('leaves a name no number gives to the 404', async () => {
    const { next } = await serve('podzim.pdf')

    expect(mocks.issuePdfFindFirst).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
