import { prisma } from '~/utils/db.server'
import { getIssuePublishedNumber } from '~/utils/issue/get-issue-published-number'
import { getNextFreeIssueOrder } from '~/utils/issue/get-next-free-issue-order'

import { findTakenIssueIds } from './find-taken-issue-ids.server'

type Options = {
  issueId: string
  year: number | null
  order: number | null
  supplementSlug: string
}

/**
 * Whether another issue holds this issue's number as published (log 0039),
 * with a free order to offer for a main issue (design 26d).
 *
 * @param options - The issue and the number it has.
 * @returns The taken number (`getIssuePublishedNumber`) and `freeOrder`, the
 *   year's next order after the other main issues, `null` for a supplement,
 *   which takes its issue's order; or `null` when the number is free or
 *   incomplete.
 */
export const findPublishedNumberConflict = async ({
  issueId,
  year,
  order,
  supplementSlug,
}: Options): Promise<{
  takenNumber: string
  freeOrder: number | null
} | null> => {
  const takenIds = await findTakenIssueIds([
    { id: issueId, order, supplementSlug, year },
  ])

  if (!takenIds.has(issueId) || year === null || order === null) return null

  const takenNumber = getIssuePublishedNumber({ order, supplementSlug, year })

  // A supplement belongs to one issue, so it gets no free order (26d).
  if (supplementSlug !== '') return { freeOrder: null, takenNumber }

  // After every other main issue of the year, drafts included, as the
  // editor's offer counts them (26c).
  const mainIssues = await prisma.issue.findMany({
    select: { order: true },
    where: {
      id: { not: issueId },
      order: { not: null },
      supplementSlug: '',
      year,
    },
  })

  return {
    freeOrder: getNextFreeIssueOrder(
      mainIssues.flatMap(({ order: mainOrder }) =>
        mainOrder === null ? [] : [mainOrder],
      ),
    ),
    takenNumber,
  }
}
