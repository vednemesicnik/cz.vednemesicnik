import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import {
  issueTitleSelect,
  resolveIssueTitles,
} from '~/utils/issue/resolve-issue-titles.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

import { buildIssuePermissionWhere } from '../../utils/build-issue-permission-where'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['issue'],
  })

  const storedIssue = await prisma.issue.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
        },
      },
      authorId: true,
      cover: {
        select: {
          id: true,
        },
      },
      id: true,
      ...issueTitleSelect,
      pdf: {
        select: {
          id: true,
        },
      },
      publishedAt: true,
      state: true,
      submittedAt: true,
    },
    where: { id: params.issueId },
  })

  const [issue] = await resolveIssueTitles(
    [storedIssue],
    buildIssuePermissionWhere(context),
  )

  requireContentUpdatePermission(context, {
    authorIds: [issue.authorId],
    id: params.issueId,
    kind: 'issue',
    state: issue.state,
    title: issue.title,
  })

  // A submitted draft is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: issue.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const authors = await getAuthorsByPermission(
    context,
    'issue',
    'update',
    issue.state,
  )

  return {
    authors,
    issue,
  }
}
