import type { PrismaClient } from '@generated/prisma/client'
import type { ContentState } from '@generated/prisma/enums'
import { users } from '~~/data/users'

import { storeSeedImage } from './store-seed-image'
import { storeSeedPdf } from './store-seed-pdf'

export type IssuesData = {
  label: string
  publishedAt: Date
  state: ContentState
  releasedAt: Date
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
          label: issue.label,
          pdf: issue.pdf
            ? {
                create: await storeSeedPdf({
                  fileName: issue.pdf.fileName,
                  filePath: issue.pdf.filePath,
                }),
              }
            : undefined,
          publishedAt: issue.publishedAt,
          releasedAt: issue.releasedAt,
          state: issue.state,
        },
      })
      .catch((error) => {
        console.error('Error creating an archived issue:', error)
        return null
      })
  }
}
