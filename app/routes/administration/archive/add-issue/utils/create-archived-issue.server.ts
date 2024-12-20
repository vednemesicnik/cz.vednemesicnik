import { invariantResponse } from "@epic-web/invariant"

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
  ordinalNumber: string
  releasedAt: string
  published: boolean
  cover: File
  pdf: File
  authorId: string
}

export const createArchivedIssue = async (data: Data, sessionId: string) => {
  const entities: AuthorPermissionEntity[] = ["issue"]
  const actions: AuthorPermissionAction[] = ["create", "publish"]

  const author = await getAuthorForPermissionCheck(sessionId, {
    actions,
    entities,
  })

  const [[hasCreateRight, hasPublishRight]] = getRights(author.permissions, {
    actions: ["create", "publish"],
    access: ["any", "own"],
    ownId: author.id,
    targetId: data.authorId,
  })

  invariantResponse(hasCreateRight, "Unauthorized", {
    status: 401,
  })

  const { ordinalNumber, releasedAt, published, cover, pdf, authorId } = data

  const formattedPublished = hasPublishRight ? published : false

  const releaseDate = new Date(releasedAt)
  const year = releaseDate.getFullYear()
  const monthYear = releaseDate.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
  })
  const label = `${ordinalNumber}/${monthYear}`

  const convertedCover = await convertImage(cover, {
    width: "905",
    height: "1280",
    quality: "100",
    format: "jpeg",
  })

  try {
    await prisma.issue.create({
      data: {
        label: label,
        releasedAt: releaseDate,
        state: formattedPublished ? "published" : "draft",
        publishedAt: formattedPublished ? new Date() : undefined,
        cover: {
          create: {
            altText: `Obálka výtisku ${label}`,
            contentType: convertedCover.contentType,
            blob: convertedCover.blob,
          },
        },
        pdf: {
          create: {
            fileName: `VDM-${year}-${ordinalNumber}.pdf`,
            contentType: pdf.type,
            blob: await pdf.bytes(),
          },
        },
        authorId: authorId,
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to add the archived issue.")
  }
}
