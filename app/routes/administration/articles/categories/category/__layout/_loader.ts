import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { categoryId } = params

  const category = await prisma.articleCategory.findUnique({
    select: { name: true },
    where: { id: categoryId },
  })

  if (category === null) {
    throw data(null, { status: 404 })
  }

  return {
    categoryName: category.name,
  }
}
