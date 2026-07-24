import { href } from 'react-router'

import { runContentStateAction } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { tagContentStateHandlers } from './utils/content-state-handlers.server'

export const action = ({ request, params }: Route.ActionArgs) => {
  const { tagId } = params

  return runContentStateAction(request, {
    deleteRedirectTo: href('/administration/articles/tags'),
    handlers: tagContentStateHandlers,
    id: tagId,
    loadTarget: async () => {
      const currentTag = await prisma.articleTag.findUniqueOrThrow({
        select: { authorId: true, state: true },
        where: { id: tagId },
      })

      return { authorIds: [currentTag.authorId], state: currentTag.state }
    },
  })
}
