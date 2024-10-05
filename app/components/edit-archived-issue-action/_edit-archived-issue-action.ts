import { createId } from "@paralleldrive/cuid2"
import { type ArchivedIssueCover, type ArchivedIssuePDF } from "@prisma/client"
import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { formFields } from "~/components/edit-archived-issue-form/_form-fields"
import { routesConfig } from "~/config/routes-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { hasFile } from "~/utils/has-file"

export const editArchivedIssueAction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await getMultipartFormData(request)

  await validateCSRF(formData, request.headers)

  const id = formData.get(formFields.issueId.name) as string | undefined
  const ordinalNumber = formData.get(formFields.ordinalNumber.name) as string
  const publishedAt = formData.get(formFields.publishedAt.name) as string
  const published = formData.get(formFields.published.name) as string
  const cover = formData.get(formFields.cover.name) as File
  const coverId = formData.get(formFields.coverId.name) as string
  const pdf = formData.get(formFields.pdf.name) as File
  const pdfId = formData.get(formFields.pdfId.name) as string

  // TODO: Add validation

  const publishedAtDate = new Date(publishedAt as string)
  const year = publishedAtDate.getFullYear()
  const monthYear = publishedAtDate.toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
  })
  const label = `${ordinalNumber}/${monthYear}`

  const coverAltText = `Obálka výtisku ${label}`
  const pdfFileName = `VDM-${year}-${ordinalNumber}.pdf`

  const coverData = (
    hasFile(cover)
      ? {
          id: createId(),
          altText: coverAltText,
          contentType: cover.type,
          blob: Buffer.from(await cover.arrayBuffer()),
        }
      : {
          altText: coverAltText,
        }
  ) satisfies Partial<ArchivedIssueCover>

  const pdfData = (
    hasFile(pdf)
      ? {
          id: createId(),
          fileName: pdfFileName,
          contentType: pdf.type,
          blob: Buffer.from(await pdf.arrayBuffer()),
        }
      : {
          fileName: pdfFileName,
        }
  ) satisfies Partial<ArchivedIssuePDF>

  await prisma.archivedIssue.update({
    where: { id: id },
    data: {
      label: label,
      publishedAt: publishedAtDate,
      published: published === "true",
      cover: {
        update: {
          where: { id: coverId },
          data: coverData,
        },
      },
      pdf: {
        update: {
          where: { id: pdfId },
          data: pdfData,
        },
      },
    },
  })

  const archiveAdministrationPath =
    routesConfig.administration.archive.index.staticPath

  return redirect(archiveAdministrationPath)
}
