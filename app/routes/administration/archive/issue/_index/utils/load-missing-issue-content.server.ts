import { prisma } from '~/utils/db.server'

import { getMissingIssueContent } from './get-missing-issue-content'

/**
 * What the stored issue still lacks before it can be submitted or published
 * (design 26e), read for the submit and publish transitions.
 *
 * @param id - The issue.
 * @returns The sentence of {@link getMissingIssueContent}; empty when complete.
 */
export const loadMissingIssueContent = async (id: string) => {
  const issue = await prisma.issue.findUniqueOrThrow({
    select: {
      cover: { select: { id: true } },
      order: true,
      pdf: { select: { fileName: true } },
      year: true,
    },
    where: { id },
  })

  return getMissingIssueContent({
    hasCover: issue.cover !== null,
    order: issue.order,
    pdf: issue.pdf,
    year: issue.year,
  })
}
