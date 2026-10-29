import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getIssueTitle } from '~/utils/issue/get-issue-title'
import { issueTitleSelect } from '~/utils/issue/issue-title-select'
import { resolveIssueTitles } from '~/utils/issue/resolve-issue-titles.server'
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
      authorId: true,
      firstContentAt: true,
      id: true,
      state: true,
    },
    where: { id: issueId },
  })

  if (issue === null) {
    throw data(null, { status: 404 })
  }

  // An issue the viewer may not see is named by its order, as a supplement
  // names it (26a): the breadcrumb data reaches the browser even when the page
  // under it is a 404.
  const canView = context.can({
    action: 'view',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.authorId],
  }).hasPermission

  if (!canView) {
    return {
      issue: {
        id: issue.id,
        title: getIssueTitle({ ...issue, name: null, supplement: null }),
      },
    }
  }

  // A new draft is named as the button that made it until its first save
  // (26c); its editor adds no crumb of its own.
  if (issue.firstContentAt === null) {
    return { issue: { id: issue.id, title: 'Nové číslo' } }
  }

  const [titledIssue] = await resolveIssueTitles(
    [issue],
    buildIssuePermissionWhere(context),
  )

  return { issue: { id: titledIssue.id, title: titledIssue.title } }
}
