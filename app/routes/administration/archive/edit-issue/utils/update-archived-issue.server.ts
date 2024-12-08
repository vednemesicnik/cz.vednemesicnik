import { invariantResponse } from "@epic-web/invariant"
import { createId } from "@paralleldrive/cuid2"

import { prisma } from "~/utils/db.server"
import { getAuthorForPermissionCheck } from "~/utils/get-author-for-permission-check.server"
import { getRights } from "~/utils/permissions"
import { convertImage } from "~/utils/sharp.server"
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

  const entities: AuthorPermissionEntity[] = ["issue"]
  const actions: AuthorPermissionAction[] = ["update", "publish"]

  const author = await getAuthorForPermissionCheck(sessionId, {
    actions,
    entities,
  })

  const [[hasUpdateRight, hasPublishRight]] = getRights(author.permissions, {
    actions: ["update", "publish"],
    access: ["any", "own"],
    ownId: author.id,
    targetId: data.authorId,
  })

  invariantResponse(hasUpdateRight, "Unauthorized", {
    status: 401,
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

  const convertedCover = cover
    ? await convertImage(cover, {
        width: "905",
        height: "1280",
        quality: "100",
        format: "jpeg",
      })
    : undefined

  try {
    await prisma.issue.update({
      where: { id: id },
      data: {
        label: label,
        releasedAt: releaseDate,
        state: formattedPublished ? "published" : "draft",
        ...(!publishedBefore && formattedPublished
          ? { publishedAt: new Date() }
          : {}),
        cover: {
          update: {
            where: { id: coverId },
            data:
              convertedCover !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new image
                    altText: coverAltText,
                    contentType: convertedCover.contentType,
                    blob: Uint8Array.from(convertedCover.blob),
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
                    blob: await pdf.bytes(),
                  }
                : {
                    fileName: pdfFileName,
                  },
          },
        },
        authorId: authorId,
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to update the archived issue.")
  }
}
