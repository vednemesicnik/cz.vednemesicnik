import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import {
  issueTitleSelect,
  resolveIssueTitles,
} from '~/utils/issue/resolve-issue-titles.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import { buildIssuePermissionWhere } from '../../utils/build-issue-permission-where'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { issueId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['view'],
    entities: ['issue'],
  })

  const issue = await prisma.issue.findUnique({
    select: {
      ...issueTitleSelect,
      id: true,
    },
    where: { id: issueId },
  })

  if (issue === null) {
    throw data(null, { status: 404 })
  }

  const [titledIssue] = await resolveIssueTitles(
    [issue],
    buildIssuePermissionWhere(context),
  )

  return { issue: { id: titledIssue.id, title: titledIssue.title } }
}
