import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  id: string
  ordinalNumber: string
  publishedAt: string
  published: boolean
  coverId: string
  cover?: File
  pdfId: string
  pdf?: File
}

export const updateArchivedIssue = async ({
  id,
  ordinalNumber,
  publishedAt,
  published,
  coverId,
  cover,
  pdfId,
  pdf,
}: Args) => {
  const publishedDate = new Date(publishedAt as string)
  const year = publishedDate.getFullYear()
  const monthYear = publishedDate.toLocaleDateString("cs-CZ", {
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
        publishedAt: publishedDate,
        published,
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
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update the archived issue. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
