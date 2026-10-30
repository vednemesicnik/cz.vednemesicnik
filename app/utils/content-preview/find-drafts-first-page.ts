import { computeDraftsFirstWindow } from './compute-drafts-first-window'

type PageWindow = { skip: number; take: number }

/**
 * Loads a page of a date-ordered list with every draft on top, as if it were
 * published now (10d): drafts by their last save, then the rest by their
 * publication date. A retracted draft keeps its old date, so one query
 * ordered by date can't do it.
 *
 * @param options.countDrafts - Counts the list's drafts.
 * @param options.findDrafts - Loads a window of the drafts, newest save first.
 * @param options.findRest - Loads a window of the rest, newest publication first.
 * @param options.skip - The items before this page in the whole list.
 * @param options.take - The page size.
 * @returns The page's items, drafts first.
 */
export const findDraftsFirstPage = async <Item>({
  countDrafts,
  findDrafts,
  findRest,
  skip,
  take,
}: {
  countDrafts: () => Promise<number>
  findDrafts: (window: PageWindow) => Promise<Item[]>
  findRest: (window: PageWindow) => Promise<Item[]>
  skip: number
  take: number
}): Promise<Item[]> => {
  const draftCount = await countDrafts()
  const window = computeDraftsFirstWindow({ draftCount, skip, take })

  const [drafts, rest] = await Promise.all([
    window.draftTake > 0
      ? findDrafts({ skip: window.draftSkip, take: window.draftTake })
      : [],
    window.restTake > 0
      ? findRest({ skip: window.restSkip, take: window.restTake })
      : [],
  ])

  return [...drafts, ...rest]
}
