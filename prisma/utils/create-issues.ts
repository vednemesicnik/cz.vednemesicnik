import type { PrismaClient } from "@generated/prisma/client"
import { type ContentState } from "@generated/prisma/enums"
import { users } from "~~/data/users"

import { getIssueCover } from "./get-issue-cover"
import { getIssuePdf } from "./get-issue-pdf"

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
    where: { email: users[0].email },
    select: { authorId: true },
  })

  for (const issue of data) {
    await prisma.issue
      .create({
        data: {
          label: issue.label,
          publishedAt: issue.publishedAt,
          state: issue.state,
          releasedAt: issue.releasedAt,
          cover: issue.cover
            ? {
                create: await getIssueCover({
                  altText: issue.cover.altText,
                  filePath: issue.cover.filePath,
                }),
              }
            : undefined,
          pdf: issue.pdf
            ? {
                create: await getIssuePdf({
                  fileName: issue.pdf.fileName,
                  filePath: issue.pdf.filePath,
                }),
              }
            : undefined,
          author: {
            connect: { id: user.authorId },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating an archived issue:", error)
        return null
      })
  }
}
