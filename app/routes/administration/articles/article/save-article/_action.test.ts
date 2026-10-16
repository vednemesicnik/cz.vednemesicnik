import { beforeEach, describe, expect, test, vi } from 'vitest'

import { action } from './_action'

const mocks = vi.hoisted(() => ({
  requireCSRF: vi.fn(),
  updateArticle: vi.fn(),
}))

vi.mock('~/utils/csrf.server', () => ({ requireCSRF: mocks.requireCSRF }))

vi.mock('../edit-article/utils/update-article.server', () => ({
  updateArticle: mocks.updateArticle,
}))

const buildRequest = (fields: Record<string, string>) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, value)
  }
  return new Request('https://test.local/administration/articles/a/save', {
    body: formData,
    method: 'POST',
  })
}

const validFields = {
  'authorIds[0]': 'author-1',
  editTabId: 'tab-1',
  featuredImage: 'none',
  title: 'Deset knih',
}

const callAction = (request: Request) =>
  action({
    context: {},
    params: { articleId: 'article-1' },
    request,
  } as unknown as Parameters<typeof action>[0])

beforeEach(() => {
  vi.clearAllMocks()
  mocks.updateArticle.mockResolvedValue({
    slugSuggestion: null,
    status: 'saved',
    updatedAt: new Date('2026-10-15T12:06:00Z'),
  })
})

describe('save-article action (design 24e, decision 0022)', () => {
  test('requires the session and saves for the editor’s tab', async () => {
    const response = await callAction(buildRequest(validFields))

    expect(mocks.requireCSRF).toHaveBeenCalledOnce()
    expect(mocks.updateArticle).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        articleId: 'article-1',
        authorIds: ['author-1'],
        releaseHold: false,
        tabId: 'tab-1',
        title: 'Deset knih',
      }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      slugSuggestion: null,
      status: 'saved',
      updatedAt: '2026-10-15T12:06:00.000Z',
    })
  })

  test('the save of a page going away ends the hold', async () => {
    await callAction(buildRequest({ ...validFields, releaseHold: 'true' }))

    expect(mocks.updateArticle.mock.lastCall?.[1].releaseHold).toBe(true)
  })

  test('refuses an article without an author (24j)', async () => {
    const { 'authorIds[0]': _author, ...withoutAuthor } = validFields

    const response = await callAction(buildRequest(withoutAuthor))

    expect(response.status).toBe(400)
    expect(mocks.updateArticle).not.toHaveBeenCalled()
  })

  test('answers 409 with the holder when the tab does not hold it', async () => {
    mocks.updateArticle.mockResolvedValue({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })

    const response = await callAction(buildRequest(validFields))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
  })

  test('answers 400 for a form it cannot read', async () => {
    const { editTabId: _editTabId, ...withoutTab } = validFields

    const response = await callAction(buildRequest(withoutTab))

    expect(response.status).toBe(400)
    expect(mocks.updateArticle).not.toHaveBeenCalled()
  })
})
