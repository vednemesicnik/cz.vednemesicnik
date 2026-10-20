import type { PrismaClient } from '@generated/prisma/client'
import type { ContentState } from '@generated/prisma/enums'
import { slugify } from '~/utils/slugify'
import { users } from '~~/data/users'

import { storeSeedImage } from './store-seed-image'
import { storeSeedPdf } from './store-seed-pdf'

export type IssuesData = {
  year: number
  order: number
  name?: string
  supplement?: string
  publishedAt: Date
  state: ContentState
  cover?: {
    altText: string
    filePath: string
  }
  pdf?: {
    fileName: string
    filePath: string
  }
}[]

export const createIssues = async (prisma: PrismaClient, data: IssuesData) => {
  const user = await prisma.user.findUniqueOrThrow({
    select: { authorId: true },
    where: { email: users[0].email },
  })

  for (const issue of data) {
    await prisma.issue
      .create({
        data: {
          author: {
            connect: { id: user.authorId },
          },
          cover: issue.cover
            ? {
                create: await storeSeedImage({
                  altText: issue.cover.altText,
                  filePath: issue.cover.filePath,
                }),
              }
            : undefined,
          // A seeded issue has content: it is no empty draft (decision 0020).
          firstContentAt: new Date(),
          name: issue.name,
          order: issue.order,
          pdf: issue.pdf
            ? {
                create: await storeSeedPdf({
                  fileName: issue.pdf.fileName,
                  filePath: issue.pdf.filePath,
                }),
              }
            : undefined,
          publishedAt: issue.publishedAt,
          state: issue.state,
          supplement: issue.supplement,
          supplementSlug: issue.supplement ? slugify(issue.supplement) : '',
          year: issue.year,
        },
      })
      .catch((error) => {
        console.error('Error creating an archived issue:', error)
        return null
      })
  }
}
