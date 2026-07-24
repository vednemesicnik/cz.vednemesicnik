import { href } from 'react-router'

import { runContentStateAction } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { issueContentStateHandlers } from './utils/content-state-handlers.server'

export const action = ({ request, params }: Route.ActionArgs) => {
  const { issueId } = params

  return runContentStateAction(request, {
    deleteRedirectTo: href('/administration/archive'),
    handlers: issueContentStateHandlers,
    id: issueId,
    loadTarget: async () => {
      const currentIssue = await prisma.issue.findUniqueOrThrow({
        select: { authorId: true, state: true },
        where: { id: issueId },
      })

      return { authorIds: [currentIssue.authorId], state: currentIssue.state }
    },
  })
}
