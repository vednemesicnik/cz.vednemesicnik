import type { PrismaClient } from '@generated/prisma/client'
import type { ContentState } from '@generated/prisma/enums'
import { getIssuePublishedNumber } from '~/utils/issue/get-issue-published-number'
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
    const supplementSlug = issue.supplement ? slugify(issue.supplement) : ''

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
          // A seeded issue has content: it is no empty draft (log 0020).
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
          // Published once, it holds its number (log 0039).
          publishedNumber:
            issue.state === 'draft'
              ? null
              : getIssuePublishedNumber({
                  order: issue.order,
                  supplementSlug,
                  year: issue.year,
                }),
          state: issue.state,
          supplement: issue.supplement,
          supplementSlug,
          year: issue.year,
        },
      })
      .catch((error) => {
        console.error('Error creating an archived issue:', error)
        return null
      })
  }
}
