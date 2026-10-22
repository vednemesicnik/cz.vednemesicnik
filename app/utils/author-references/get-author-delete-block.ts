import type { Prisma } from '@generated/prisma/client'

import {
  AUTHOR_CONTENT_TYPES,
  type AuthorContentType,
} from '~/config/author-content-count-config'

import type { AUTHOR_REFERENCES_SELECT } from './author-references-select'

type AuthorReferences = Prisma.AuthorGetPayload<{
  select: typeof AUTHOR_REFERENCES_SELECT
}>

export type AuthorDeleteBlock = {
  deletable: boolean
  contentCounts: Record<AuthorContentType, number>
  hasApprovals: boolean
  hasAccount: boolean
}

/**
 * Whether an author can be deleted, and what holds it if not (design 28g).
 * Content and approvals hold it on the database, and an article would lose it
 * from its authors (#767); the account goes first.
 *
 * @param author - The author read with `AUTHOR_REFERENCES_SELECT`.
 * @returns `deletable` when nothing holds the author; otherwise the content
 *   counts, whether it gave approvals and whether it has an account.
 */
export const getAuthorDeleteBlock = (
  author: AuthorReferences,
): AuthorDeleteBlock => {
  const contentCounts = Object.fromEntries(
    AUTHOR_CONTENT_TYPES.map((type) => [type, author._count[type]]),
  ) as Record<AuthorContentType, number>

  const hasContent = AUTHOR_CONTENT_TYPES.some(
    (type) => contentCounts[type] > 0,
  )
  const hasApprovals = author._count.reviews > 0
  const hasAccount = author.user !== null

  return {
    contentCounts,
    deletable: !hasContent && !hasApprovals && !hasAccount,
    hasAccount,
    hasApprovals,
  }
}
