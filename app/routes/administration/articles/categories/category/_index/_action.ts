import { href } from 'react-router'

import { runContentStateAction } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { categoryContentStateHandlers } from './utils/content-state-handlers.server'

export const action = ({ request, params }: Route.ActionArgs) => {
  const { categoryId } = params

  return runContentStateAction(request, {
    deleteRedirectTo: href('/administration/articles/categories'),
    handlers: categoryContentStateHandlers,
    id: categoryId,
    loadTarget: async () => {
      const currentCategory = await prisma.articleCategory.findUniqueOrThrow({
        select: { authorId: true, state: true },
        where: { id: categoryId },
      })

      return {
        authorIds: [currentCategory.authorId],
        state: currentCategory.state,
      }
    },
  })
}
