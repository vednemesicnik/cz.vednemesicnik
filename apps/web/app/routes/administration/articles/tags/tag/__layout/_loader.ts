import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { tagId } = params

  const tag = await prisma.articleTag.findUnique({
    select: { name: true },
    where: { id: tagId },
  })

  if (tag === null) {
    throw data(null, { status: 404 })
  }

  return {
    tagName: tag.name,
  }
}
