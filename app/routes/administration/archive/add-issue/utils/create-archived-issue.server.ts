import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { getAuthorForPermissionCheck } from "~/utils/get-author-for-permission-check.server"
import { getRights } from "~/utils/permissions"
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
            contentType: cover.type,
            blob: Buffer.from(await cover.arrayBuffer()),
          },
        },
        pdf: {
          create: {
            fileName: `VDM-${year}-${ordinalNumber}.pdf`,
            contentType: pdf.type,
            blob: Buffer.from(await pdf.arrayBuffer()),
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