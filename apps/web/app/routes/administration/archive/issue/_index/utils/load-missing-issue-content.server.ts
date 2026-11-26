import { prisma } from '~/utils/db.server'

import { findTakenIssueIds } from '../../../utils/find-taken-issue-ids.server'
import { getMissingIssueContent } from './get-missing-issue-content'

/**
 * What the stored issue still lacks before it can be submitted, approved or
 * published (design 26e), read for those transitions; a number another issue
 * holds as published among it (log 0039).
 *
 * @param id - The issue.
 * @returns The sentences of {@link getMissingIssueContent}; empty when complete.
 */
export const loadMissingIssueContent = async (id: string) => {
  const issue = await prisma.issue.findUniqueOrThrow({
    select: {
      cover: { select: { id: true } },
      order: true,
      pdf: { select: { id: true } },
      supplement: true,
      supplementSlug: true,
      year: true,
    },
    where: { id },
  })

  const takenIds = await findTakenIssueIds([{ ...issue, id }])

  return getMissingIssueContent({
    hasCover: issue.cover !== null,
    hasPdf: issue.pdf !== null,
    isNumberTaken: takenIds.has(id),
    order: issue.order,
    supplement: issue.supplement,
    year: issue.year,
  })
}
