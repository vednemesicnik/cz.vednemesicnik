import type {
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { data, href } from 'react-router'
import {
  type AdminEditableKind,
  getAdminEditDeniedData,
} from '~/components/boundary-error/utils/boundary-copy'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'

export type ContentUpdateTarget = {
  kind: AdminEditableKind
  id: string
  /** For an episode, the parent podcast. */
  podcastId?: string
  title: string
  state: ContentState
  authorIds: string[]
}

const entities: Record<AdminEditableKind, AuthorPermissionEntity> = {
  article: 'article',
  category: 'article_category',
  episode: 'podcast_episode',
  issue: 'issue',
  podcast: 'podcast',
  tag: 'article_tag',
}

const getRecordHref = ({ kind, id, podcastId }: ContentUpdateTarget) => {
  switch (kind) {
    case 'article':
      return href('/administration/articles/:articleId', { articleId: id })
    case 'category':
      return href('/administration/articles/categories/:categoryId', {
        categoryId: id,
      })
    case 'tag':
      return href('/administration/articles/tags/:tagId', { tagId: id })
    case 'issue':
      return href('/administration/archive/:issueId', { issueId: id })
    case 'podcast':
      return href('/administration/podcasts/:podcastId', { podcastId: id })
    case 'episode':
      return href('/administration/podcasts/:podcastId/episodes/:episodeId', {
        episodeId: id,
        podcastId: podcastId ?? '',
      })
  }
}

/**
 * Guards an edit page of content with a state (design 30d, 30e, 30h). Content the
 * person may not view is a 404, so the edit address doesn't reveal it exists. A
 * refused edit throws a 403 with the reason from the 07c matrix: published content,
 * or someone else's draft. Anything else (archived) throws the generic 403.
 *
 * @param context - The author permission context; must load `view` and `update`.
 * @param target - The record being edited.
 * @returns `hasOwn` and `hasAny` of the update permission.
 */
export const requireContentUpdatePermission = (
  context: AuthorPermissionContext,
  target: ContentUpdateTarget,
) => {
  const entity = entities[target.kind]
  const permissionTarget = {
    entity,
    state: target.state,
    targetAuthorIds: target.authorIds,
  }

  if (!context.can({ action: 'view', ...permissionTarget }).hasPermission) {
    throw data(null, { status: 404 })
  }

  const { hasPermission, hasOwn, hasAny } = context.can({
    action: 'update',
    ...permissionTarget,
  })

  if (hasPermission) {
    return { hasAny, hasOwn }
  }

  const isOwn = target.authorIds.includes(context.authorId)
  const reason =
    target.state === 'published'
      ? 'published'
      : target.state === 'draft' && !isOwn
        ? 'foreign-draft'
        : null

  if (reason === null) {
    throw data(null, { status: 403 })
  }

  throw data(
    getAdminEditDeniedData({
      kind: target.kind,
      podcastId: target.podcastId,
      reason,
      recordHref: getRecordHref(target),
      title: target.title,
    }),
    { status: 403 },
  )
}
