import { href } from 'react-router'

import { runContentStateAction } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { articleContentStateHandlers } from './utils/content-state-handlers.server'

export const action = ({ request, params }: Route.ActionArgs) => {
  const { articleId } = params

  return runContentStateAction(request, {
    deleteRedirectTo: href('/administration/articles'),
    handlers: articleContentStateHandlers,
    id: articleId,
    loadTarget: async () => {
      const currentArticle = await prisma.article.findUniqueOrThrow({
        select: { authors: { select: { id: true } }, state: true },
        where: { id: articleId },
      })

      return {
        authorIds: currentArticle.authors.map((author) => author.id),
        state: currentArticle.state,
      }
    },
    supportsChangePublishedAt: true,
  })
}
