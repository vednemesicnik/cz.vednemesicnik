import { prisma } from '~/utils/db.server'
import { getIssuePublishedNumber } from '~/utils/issue/get-issue-published-number'

type Issue = {
  id: string
  year: number | null
  order: number | null
  supplementSlug: string
}

/**
 * The issues whose number another issue holds as published (log 0039): only
 * a published number is unique, so two drafts may share one. A retracted or
 * archived issue keeps holding its number, and an issue never conflicts with
 * the number it holds itself.
 *
 * @param issues - The issues with their year, order and supplement slug.
 * @returns The ids of those whose number is taken; one without its year or
 *   order never is.
 */
export const findTakenIssueIds = async (
  issues: readonly Issue[],
): Promise<Set<string>> => {
  const numbered = issues.flatMap(({ id, year, order, supplementSlug }) =>
    year === null || order === null
      ? []
      : [
          {
            id,
            number: getIssuePublishedNumber({ order, supplementSlug, year }),
          },
        ],
  )

  if (numbered.length === 0) return new Set()

  const holders = await prisma.issue.findMany({
    select: { id: true, publishedNumber: true },
    where: {
      publishedNumber: { in: numbered.map(({ number }) => number) },
    },
  })
  const holderIds = new Map(
    holders.map(({ id, publishedNumber }) => [publishedNumber, id]),
  )

  return new Set(
    numbered.flatMap(({ id, number }) => {
      const holderId = holderIds.get(number)
      return holderId === undefined || holderId === id ? [] : [id]
    }),
  )
}
