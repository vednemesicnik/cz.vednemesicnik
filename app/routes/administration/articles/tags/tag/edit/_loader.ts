import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { canChooseRecordAuthor } from '../../../utils/can-choose-record-author'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['article_tag'],
  })

  const tag = await prisma.articleTag.findUnique({
    select: {
      authorId: true,
      id: true,
      name: true,
      publishedAt: true,
      slug: true,
      state: true,
      submittedAt: true,
    },
    where: { id: params.tagId },
  })

  if (tag === null) {
    throw data(null, { status: 404 })
  }

  // A published tag has no edit (design 07b, gbsczekj); the guard says why.
  requireContentUpdatePermission(context, {
    authorIds: [tag.authorId],
    id: tag.id,
    kind: 'tag',
    state: tag.state,
    title: tag.name,
  })

  // A submitted draft is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: tag.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  return {
    // Only the Coordinator picks the author (design 25c, iq3nur0e).
    authors: canChooseRecordAuthor(context.roleLevel)
      ? await getAuthorsByPermission(
          context,
          'article_tag',
          'update',
          tag.state,
        )
      : null,
    // A draft published before warns that its address changes (design 25c).
    publishedSlug:
      tag.state === 'draft' && tag.publishedAt !== null ? tag.slug : null,
    tag: {
      authorId: tag.authorId,
      name: tag.name,
      slug: tag.slug,
    },
  }
}
