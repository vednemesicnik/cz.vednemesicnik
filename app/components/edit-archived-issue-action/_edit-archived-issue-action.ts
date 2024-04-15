import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { prisma } from "~/utils/db.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { formFields } from "~/components/edit-archived-issue-form/_form-fields"
import { hasFile } from "~/utils/has-file"
import { createId } from "@paralleldrive/cuid2"
import { validateCSRF } from "~/utils/csrf.server"

export const editArchivedIssueAction = async ({ request }: ActionFunctionArgs) => {
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
  const monthYear = publishedAtDate.toLocaleDateString("cs-CZ", { year: "numeric", month: "long" })
  const label = `${ordinalNumber}/${monthYear}`

  const coverAltText = `Obálka výtisku ${label}`
  const pdfFilename = `VDM-${year}-${ordinalNumber}.pdf`

  const coverData = hasFile(cover)
    ? {
        id: createId(),
        altText: coverAltText,
        contentType: cover.type,
        blob: Buffer.from(await cover.arrayBuffer()),
      }
    : {
        altText: coverAltText,
      }

  const pdfData = hasFile(pdf)
    ? {
        id: createId(),
        filename: pdfFilename,
        contentType: pdf.type,
        blob: Buffer.from(await pdf.arrayBuffer()),
      }
    : {
        filename: pdfFilename,
      }

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

  return redirect(`/archive`)
}
