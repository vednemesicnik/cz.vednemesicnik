import { type ArchivedIssueCover, type ArchivedIssuePDF } from "@prisma/client"
import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { formFields } from "~/components/add-archived-issue-form/_form-fields"
import { routesConfig } from "~/config/routes-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"

export const addArchivedIssueAction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await getMultipartFormData(request)

  await validateCSRF(formData, request.headers)

  const ordinalNumber = formData.get(formFields.ordinalNumber.name) as string
  const publishedAt = formData.get(formFields.publishedAt.name) as string
  const published = formData.get(formFields.published.name) as string
  const cover = formData.get(formFields.cover.name) as File
  const pdf = formData.get(formFields.pdf.name) as File

  // TODO: Add validation
  // Cover image should have a 200 kB maximum size
  // PDF file should have a 8 MB maximum size

  const publishedAtDate = new Date(publishedAt as string)
  const year = publishedAtDate.getFullYear()
  const monthYear = publishedAtDate.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
  })
  const label = `${ordinalNumber}/${monthYear}`

  const coverAltText = `Obálka výtisku ${label}`
  const pdfFilename = `VDM-${year}-${ordinalNumber}.pdf`

  const coverData = {
    altText: coverAltText,
    contentType: cover.type,
    blob: Buffer.from(await cover.arrayBuffer()),
  } satisfies Partial<ArchivedIssueCover>

  const pdfData = {
    fileName: pdfFilename,
    contentType: pdf.type,
    blob: Buffer.from(await pdf.arrayBuffer()),
  } satisfies Partial<ArchivedIssuePDF>

  await prisma.archivedIssue.create({
    data: {
      label: label,
      publishedAt: publishedAtDate,
      published: published === "true",
      cover: {
        create: coverData,
      },
      pdf: {
        create: pdfData,
      },
      author: {
        connect: { username: "owner" },
      },
    },
  })

  const archiveAdministrationPath =
    routesConfig.administration.archive.index.staticPath

  return redirect(archiveAdministrationPath)
}
