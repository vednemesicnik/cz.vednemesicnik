import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { articleId } = params

  const article = await prisma.article.findUnique({
    select: {
      id: true,
      title: true,
    },
    where: {
      id: articleId,
    },
  })

  if (article === null) {
    throw data(null, { status: 404 })
  }

  return { article }
}
