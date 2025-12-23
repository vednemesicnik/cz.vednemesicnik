import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { categoryId } = params

  const category = await prisma.articleCategory.findUnique({
    select: { name: true },
    where: { id: categoryId },
  })

  return {
    categoryName: category?.name,
  }
}
