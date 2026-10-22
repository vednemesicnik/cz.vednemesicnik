import type { Prisma } from '@generated/prisma/client'

import {
  AUTHOR_CONTENT_TYPES,
  type AuthorContentType,
} from '~/config/author-content-count-config'

import type { AUTHOR_REFERENCES_SELECT } from './author-references-select'

type AuthorReferences = Prisma.AuthorGetPayload<{
  select: typeof AUTHOR_REFERENCES_SELECT
}>

/**
 * The account that holds an author: none, one that can be deleted first, the
 * Owner's, or the viewer's own — the last two can never be deleted.
 */
export type AuthorAccount = 'none' | 'deletable' | 'owner' | 'own'

export type AuthorDeleteBlock = {
  deletable: boolean
  contentCounts: Record<AuthorContentType, number>
  hasApprovals: boolean
  account: AuthorAccount
}

const getAuthorAccount = (
  user: AuthorReferences['user'],
  viewerUserId: string,
): AuthorAccount => {
  if (user === null) return 'none'
  // The Owner's account is never deleted, whoever looks (copy zq7c99v0).
  if (user.role.name === 'owner') return 'owner'
  if (user.id === viewerUserId) return 'own'

  return 'deletable'
}

/**
 * Whether an author can be deleted, and what holds it if not (design 28g).
 * Content and approvals hold it on the database, and an article would lose it
 * from its authors (#767); the account goes first.
 *
 * @param author - The author read with `AUTHOR_REFERENCES_SELECT`.
 * @param viewerUserId - The signed-in account, to tell its own author apart.
 * @returns `deletable` when nothing holds the author; otherwise the content
 *   counts, whether it gave approvals and which account it has.
 */
export const getAuthorDeleteBlock = (
  author: AuthorReferences,
  viewerUserId: string,
): AuthorDeleteBlock => {
  const contentCounts = Object.fromEntries(
    AUTHOR_CONTENT_TYPES.map((type) => [type, author._count[type]]),
  ) as Record<AuthorContentType, number>

  const hasContent = AUTHOR_CONTENT_TYPES.some(
    (type) => contentCounts[type] > 0,
  )
  const hasApprovals = author._count.reviews > 0
  const account = getAuthorAccount(author.user, viewerUserId)

  return {
    account,
    contentCounts,
    deletable: !hasContent && !hasApprovals && account === 'none',
    hasApprovals,
  }
}
