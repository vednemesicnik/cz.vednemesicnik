import { describe, expect, test, vi } from 'vitest'

import { findDraftsFirstPage } from './find-drafts-first-page'

const createList = (drafts: string[], rest: string[]) => ({
  countDrafts: async () => drafts.length,
  findDrafts: vi.fn(async ({ skip, take }: { skip: number; take: number }) =>
    drafts.slice(skip, skip + take),
  ),
  findRest: vi.fn(async ({ skip, take }: { skip: number; take: number }) =>
    rest.slice(skip, skip + take),
  ),
})

describe('findDraftsFirstPage', () => {
  test('pages run through the drafts and on into the rest', async () => {
    const list = createList(['d1', 'd2', 'd3'], ['p1', 'p2', 'p3'])

    expect(
      await findDraftsFirstPage({
        ...list,
        skip: 0,
        take: 2,
        withDrafts: true,
      }),
    ).toEqual(['d1', 'd2'])
    expect(
      await findDraftsFirstPage({
        ...list,
        skip: 2,
        take: 2,
        withDrafts: true,
      }),
    ).toEqual(['d3', 'p1'])
    expect(
      await findDraftsFirstPage({
        ...list,
        skip: 4,
        take: 2,
        withDrafts: true,
      }),
    ).toEqual(['p2', 'p3'])
  })

  test('skips the query a page does not need', async () => {
    const list = createList([], ['p1'])

    await findDraftsFirstPage({ ...list, skip: 0, take: 6, withDrafts: true })

    expect(list.findDrafts).not.toHaveBeenCalled()
    expect(list.findRest).toHaveBeenCalledWith({ skip: 0, take: 6 })
  })

  test("a reader's page skips the drafts' queries", async () => {
    const list = { ...createList(['d1'], ['p1']), countDrafts: vi.fn() }

    expect(
      await findDraftsFirstPage({
        ...list,
        skip: 0,
        take: 6,
        withDrafts: false,
      }),
    ).toEqual(['p1'])
    expect(list.countDrafts).not.toHaveBeenCalled()
    expect(list.findDrafts).not.toHaveBeenCalled()
  })
})
