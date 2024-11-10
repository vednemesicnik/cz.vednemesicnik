import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  ordinalNumber: string
  releasedAt: string
  published: boolean
  cover: File
  pdf: File
  authorId: string
}

export const addArchivedIssue = async ({
  ordinalNumber,
  releasedAt,
  published,
  cover,
  pdf,
  authorId,
}: Args) => {
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
        publishedAt: published ? new Date() : undefined,
        published,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to add the archived issue. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
