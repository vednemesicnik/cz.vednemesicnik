import { prisma } from '~/utils/db.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import { getIssueNumberConflictMessage } from './get-issue-number-conflict-message'

type Options = {
  year: number
  order: number
  supplementSlug: string
  supplement?: string
  excludeId?: string
}

/**
 * Finds the issue that already holds the year, order and supplement slug — the
 * issue's unique key (design 26d) — and says so at the field that caused it.
 * The holder is named and linked only when the viewer may see it; an empty
 * draft, which no list shows, never is (log 0020).
 *
 * @param context - The author permission context, built with `view` on `issue`.
 * @param options.supplement - The supplement as entered, named in place of a
 *   holder the viewer may not see.
 * @param options.excludeId - The edited issue, which may keep its own number.
 * @returns The field and its message, or `null` when the number is free.
 */
export const findIssueNumberConflict = async (
  context: Pick<AuthorPermissionContext, 'can'>,
  { year, order, supplementSlug, supplement, excludeId }: Options,
) => {
  const holder = await prisma.issue.findFirst({
    select: {
      authorId: true,
      firstContentAt: true,
      id: true,
      name: true,
      order: true,
      state: true,
      supplement: true,
      year: true,
    },
    where: {
      order,
      supplementSlug,
      year,
      ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
    },
  })

  if (holder === null) {
    return null
  }

  const isVisible =
    holder.firstContentAt !== null &&
    context.can({
      action: 'view',
      entity: 'issue',
      state: holder.state,
      targetAuthorIds: [holder.authorId],
    }).hasPermission

  // The holder has the number it was found by.
  const numberedHolder = {
    id: isVisible ? holder.id : null,
    name: holder.name,
    order,
    supplement: holder.supplement,
    year,
  }

  return getIssueNumberConflictMessage(
    isVisible
      ? numberedHolder
      : {
          ...numberedHolder,
          name: null,
          supplement: supplement ?? holder.supplement,
        },
  )
}
