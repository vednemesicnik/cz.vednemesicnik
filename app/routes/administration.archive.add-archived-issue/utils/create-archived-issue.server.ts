import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import { throwDbError } from "~/utils/throw-db-error.server"
import type { PermissionAction, PermissionEntity } from "~~/types/permission"

type Data = {
  ordinalNumber: string
  releasedAt: string
  published: boolean
  cover: File
  pdf: File
  authorId: string
}

export const createArchivedIssue = async (data: Data, sessionId: string) => {
  const entity: PermissionEntity = "archived_issue"
  const actions: PermissionAction[] = ["create", "publish"]

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          authorId: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity,
                  action: { in: actions },
                },
                select: {
                  access: true,
                  action: true,
                  entity: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const permissions = session.user.role.permissions

  const [hasCreateRight] = getRights(permissions, {
    actions: ["create"],
    access: ["any", "own"],
    ownId: session.user.authorId,
    targetId: data.authorId,
  })

  invariantResponse(hasCreateRight, "Unauthorized", {
    status: 401,
  })

  const { ordinalNumber, releasedAt, published, cover, pdf, authorId } = data

  const [hasPublishRight] = getRights(permissions, {
    actions: ["publish"],
    access: ["any", "own"],
    ownId: session.user.authorId,
    targetId: data.authorId,
  })

  const formattedPublished = hasPublishRight ? published : false
  const formattedPublishedAt = formattedPublished ? new Date() : undefined

  const releaseDate = new Date(releasedAt)
  const year = releaseDate.getFullYear()
  const monthYear = releaseDate.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
  })
  const label = `${ordinalNumber}/${monthYear}`

  try {
    await prisma.archivedIssue.create({
      data: {
        label: label,
        releasedAt: releaseDate,
        published: formattedPublished,
        publishedAt: formattedPublishedAt,
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
  } catch (error) {
    throwDbError(error, "Unable to add the archived issue.")
  }
}
