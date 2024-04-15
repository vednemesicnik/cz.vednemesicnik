import type { PrismaClient } from "@prisma/client"
import { getArchivedIssueCover } from "./get-archived-issue-cover"
import { getArchivedIssuePdf } from "./get-archived-issue-pdf"

export type ArchivedIssuesData = {
  label: string
  publishedAt: Date
  published: boolean
  cover?: {
    altText: string
    filePath: string
  }
  pdf?: {
    fileName: string
    filePath: string
  }
}[]

export const createArchivedIssues = async (prisma: PrismaClient, data: ArchivedIssuesData) => {
  for (const archivedIssue of data) {
    await prisma.archivedIssue
      .create({
        data: {
          label: archivedIssue.label,
          publishedAt: archivedIssue.publishedAt,
          published: archivedIssue.published,
          cover: archivedIssue.cover
            ? {
                create: await getArchivedIssueCover({
                  altText: archivedIssue.cover.altText,
                  filePath: archivedIssue.cover.filePath,
                }),
              }
            : undefined,
          pdf: archivedIssue.pdf
            ? {
                create: await getArchivedIssuePdf({
                  fileName: archivedIssue.pdf.fileName,
                  filePath: archivedIssue.pdf.filePath,
                }),
              }
            : undefined,
          author: {
            connect: { username: "owner" },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating an archived issue:", error)
        return null
      })
  }
}
