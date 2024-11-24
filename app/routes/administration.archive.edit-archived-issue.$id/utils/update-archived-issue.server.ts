import { invariantResponse } from "@epic-web/invariant"
import { createId } from "@paralleldrive/cuid2"

import { prisma } from "~/utils/db.server"
import { getAuthorForPermissionCheck } from "~/utils/get-author-for-permission-check.server"
import { getRights } from "~/utils/permissions"
import { throwDbError } from "~/utils/throw-db-error.server"
import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
} from "~~/types/permission"

type Data = {
  id: string
  ordinalNumber: string
  releasedAt: string
  published: boolean
  publishedBefore: boolean
  coverId: string
  cover?: File
  pdfId: string
  pdf?: File
  authorId: string
}

export const updateArchivedIssue = async (data: Data, sessionId: string) => {
  const {
    id,
    ordinalNumber,
    releasedAt,
    published,
    publishedBefore,
    coverId,
    cover,
    pdfId,
    pdf,
    authorId,
  } = data

  const entities: AuthorPermissionEntity[] = ["archived_issue"]
  const actions: AuthorPermissionAction[] = ["update", "publish"]

  const author = await getAuthorForPermissionCheck(sessionId, {
    actions,
    entities,
  })

  const [hasUpdateRight] = getRights(author.permissions, {
    actions: ["update"],
    access: ["any", "own"],
    ownId: author.id,
    targetId: data.authorId,
  })

  invariantResponse(hasUpdateRight, "Unauthorized", {
    status: 401,
  })

  const [hasPublishRight] = getRights(author.permissions, {
    actions: ["publish"],
    access: ["any", "own"],
    ownId: author.id,
    targetId: data.authorId,
  })

  const formattedPublished = hasPublishRight ? published : publishedBefore

  const releaseDate = new Date(releasedAt as string)
  const year = releaseDate.getFullYear()
  const monthYear = releaseDate.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
  })
  const label = `${ordinalNumber}/${monthYear}`

  const coverAltText = `Obálka výtisku ${label}`
  const pdfFileName = `VDM-${year}-${ordinalNumber}.pdf`

  try {
    await prisma.archivedIssue.update({
      where: { id: id },
      data: {
        label: label,
        releasedAt: releaseDate,
        published: formattedPublished,
        ...(!publishedBefore && formattedPublished
          ? { publishedAt: new Date() }
          : {}),
        cover: {
          update: {
            where: { id: coverId },
            data:
              cover !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new image
                    altText: coverAltText,
                    contentType: cover.type,
                    blob: Buffer.from(await cover.arrayBuffer()),
                  }
                : {
                    altText: coverAltText,
                  },
          },
        },
        pdf: {
          update: {
            where: { id: pdfId },
            data:
              pdf !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new PDF
                    fileName: pdfFileName,
                    contentType: pdf.type,
                    blob: Buffer.from(await pdf.arrayBuffer()),
                  }
                : {
                    fileName: pdfFileName,
                  },
          },
        },
        authorId: authorId,
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the archived issue.")
  }
}
