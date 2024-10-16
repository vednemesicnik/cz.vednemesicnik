import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  ordinalNumber: string
  publishedAt: string
  published: boolean
  cover: File
  pdf: File
}

export const addArchivedIssue = async ({
  ordinalNumber,
  publishedAt,
  published,
  cover,
  pdf,
}: Args) => {
  const publishedDate = new Date(publishedAt)
  const year = publishedDate.getFullYear()
  const monthYear = publishedDate.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
  })
  const label = `${ordinalNumber}/${monthYear}`

  try {
    await prisma.archivedIssue.create({
      data: {
        label: label,
        publishedAt: publishedDate,
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
        author: {
          connect: { username: "owner" },
        },
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
