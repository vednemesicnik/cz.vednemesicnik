import { data } from 'react-router'

import { getAuthorHistory } from '~/utils/audit-log/get-author-history.server'
import { AUTHOR_REFERENCES_SELECT } from '~/utils/author-references/author-references-select'
import { getAuthorContentCounts } from '~/utils/author-references/get-author-content-counts'
import { getAuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { isAssociationAuthor } from '~/utils/is-association-author'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import { getRecentAuthorContent } from '../../utils/get-recent-author-content.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { authorId } = params

  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['author', 'user'],
  })

  const author = await prisma.author.findUniqueOrThrow({
    select: {
      ...AUTHOR_REFERENCES_SELECT,
      bio: true,
      createdAt: true,
      id: true,
      name: true,
      role: {
        select: {
          id: true,
          level: true,
          name: true,
        },
      },
      user: {
        select: {
          email: true,
          id: true,
          image: { select: imageSourceSelect },
          role: { select: { name: true } },
        },
      },
    },
    where: { id: authorId },
  })

  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const targetUserId = author.user?.id

  // Check view permission
  const viewPerms = context.can({
    action: 'view',
    entity: 'author',
    targetUserId,
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!viewPerms.hasPermission) {
    throw data(null, { status: 404 })
  }

  // Check update permission
  const updatePerms = context.can({
    action: 'update',
    entity: 'author',
    targetUserId,
  })

  // Check delete permission - cannot delete own author profile
  const deletePerms = context.can({
    action: 'delete',
    entity: 'author',
    targetUserId,
  })

  // The recent items cover what the viewer may see; the counts are everything
  // the author stands on, as the 28g dialog counts it (28b).
  const contentContext = await getAuthorPermissionContext(request, {
    actions: ['view'],
    entities: ['article', 'issue', 'podcast_episode'],
  })

  const [recentContent, history] = await Promise.all([
    getRecentAuthorContent(contentContext, author.id),
    getAuthorHistory(author.id),
  ])

  const deleteBlock = getAuthorDeleteBlock(author, context.userId)

  return {
    author: {
      bio: author.bio,
      createdAt: formatNumericDate(author.createdAt),
      id: author.id,
      image: createImageSources('user-image', author.user?.image),
      isAssociation: isAssociationAuthor(author),
      name: author.name,
      role: author.role,
      user: author.user && { email: author.user.email, id: author.user.id },
    },
    // Založit účet… opens the new user with this author chosen (28b, 28f).
    canCreateUser:
      author.user === null &&
      context.can({
        action: 'create',
        entity: 'user',
        targetUserId: context.userId,
      }).hasPermission,
    canUpdate: updatePerms.hasPermission,
    contentCounts: getAuthorContentCounts(deleteBlock.contentCounts),
    // Smazat… confirms a deletable author and explains a blocked one (28g).
    deleteBlock,
    history,
    mayDelete: deletePerms.hasPermission,
    recentContent,
  }
}
