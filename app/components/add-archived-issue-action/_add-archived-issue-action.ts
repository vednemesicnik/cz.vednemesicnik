import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { prisma } from "~/utils/db.server"
import { getMultipartFormData } from "~/utils/get-multipart-form-data"
import { formFields } from "~/components/add-archived-issue-form/_form-fields"
import { validateCSRF } from "~/utils/csrf.server"

export const addArchivedIssueAction = async ({ request }: ActionFunctionArgs) => {
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
  const monthYear = publishedAtDate.toLocaleDateString("cs-CZ", { year: "numeric", month: "long" })
  const label = `${ordinalNumber}/${monthYear}`

  const coverAltText = `Obálka výtisku ${label}`
  const pdfFilename = `VDM-${year}-${ordinalNumber}.pdf`

  const coverData = {
    altText: coverAltText,
    contentType: cover.type,
    blob: Buffer.from(await cover.arrayBuffer()),
  }

  const pdfData = {
    fileName: pdfFilename,
    contentType: pdf.type,
    blob: Buffer.from(await pdf.arrayBuffer()),
  }

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

  return redirect("/archive")
}
