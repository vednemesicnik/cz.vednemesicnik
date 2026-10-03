import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { issueId } = params

  const issue = await prisma.issue.findUnique({
    select: {
      id: true,
      label: true,
    },
    where: { id: issueId },
  })

  if (issue === null) {
    throw data(null, { status: 404 })
  }

  return { issue }
}
