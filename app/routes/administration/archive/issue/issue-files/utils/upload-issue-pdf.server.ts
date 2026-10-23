import { createId } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { ISSUE_FILE_CONFIG } from '~/config/issue-file-config'
import { prisma } from '~/utils/db.server'
import {
  deletePdfObject,
  PDF_CONTENT_TYPE,
  storePdf,
} from '~/utils/pdf-store/store-pdf.server'

import { getEditedIssuePdfFileName } from '../../../utils/get-edited-issue-pdf-file-name'
import {
  type FileChangeResult,
  saveIssueFileChange,
} from './save-issue-file-change.server'

type Options = {
  issueId: string
  tabId: string
  file: File
}

// The name the PDF is stored under: built from the year and the order, so
// `null` until the issue has both, or while another PDF still has the name
// (log 0033). The editor's save names it once it can. Read after the
// file is stored: an autosave may have changed the number meanwhile.
const getPdfFileName = async (issueId: string) => {
  const issue = await prisma.issue.findUniqueOrThrow({
    select: {
      order: true,
      pdf: { select: { fileName: true, id: true } },
      state: true,
      supplementSlug: true,
      year: true,
    },
    where: { id: issueId },
  })
  const fileName = getEditedIssuePdfFileName(
    {
      order: issue.order,
      pdfFileName: issue.pdf?.fileName ?? null,
      state: issue.state,
      supplementSlug: issue.supplementSlug,
      year: issue.year,
    },
    {
      order: issue.order,
      supplementSlug: issue.supplementSlug,
      year: issue.year,
    },
  )
  if (fileName === null || fileName === issue.pdf?.fileName) return fileName

  const takenCount = await prisma.issuePDF.count({
    where: {
      fileName,
      ...(issue.pdf === null ? {} : { id: { not: issue.pdf.id } }),
    },
  })
  return takenCount > 0 ? null : fileName
}

/**
 * Stores a picked PDF as soon as it is chosen (design 26c, log 0029).
 * Every upload is stored under a fresh id, so a replacement leaves the
 * previous PDF untouched until the row points at the new one; the old object
 * goes only after the commit. The editor can cancel it until it saves: a
 * cancel during the commit deletes a new PDF and puts a replaced one back
 * (bxy8xxqs).
 *
 * @param request - The action's request.
 * @param options - The issue, the tab and the file.
 * @returns As `saveIssueFileChange`.
 * @throws A 400 response for a file that is not a PDF or is too big.
 */
export async function uploadIssuePdf(
  request: Request,
  { issueId, tabId, file }: Options,
): Promise<FileChangeResult> {
  if (
    file.size === 0 ||
    file.size > ISSUE_FILE_CONFIG.pdf.maxFileBytes ||
    file.type !== ISSUE_FILE_CONFIG.pdf.contentType
  ) {
    throw data(null, { status: 400 })
  }

  return saveIssueFileChange(request, {
    isCancellable: true,
    issueId,
    landsWithoutHold: true,
    prepare: async (issue) => {
      const pdfId = createId()

      try {
        await storePdf(pdfId, file)
      } catch {
        await deletePdfObject(pdfId).catch(() => {})
        return { status: 'failed' }
      }

      const dropStored = () => deletePdfObject(pdfId)

      let fileName: string | null
      try {
        fileName = await getPdfFileName(issueId)
      } catch (error) {
        await dropStored().catch(() => {})
        throw error
      }

      if (issue.pdf === null) {
        return {
          addsContent: true,
          logEvent: 'pdf_uploaded',
          onCancelled: async () => {
            await prisma.issuePDF.delete({
              select: { id: true },
              where: { id: pdfId },
            })
            await dropStored()
          },
          onRefused: dropStored,
          writes: [
            prisma.issuePDF.create({
              data: {
                contentType: PDF_CONTENT_TYPE,
                fileName,
                id: pdfId,
                issueId,
                originalFileName: file.name,
              },
              select: { id: true },
            }),
          ],
        }
      }

      const previousPdf = await prisma.issuePDF.findUnique({
        select: {
          contentType: true,
          fileName: true,
          id: true,
          originalFileName: true,
          uploadedAt: true,
        },
        where: { id: issue.pdf.id },
      })

      // Removed while the file was stored: nothing to replace.
      if (previousPdf === null) {
        await dropStored().catch(() => {})
        return { status: 'failed' }
      }

      return {
        logEvent: 'pdf_uploaded',
        // The previous object is still there: the row points back at it, and
        // the new one goes.
        onCancelled: async () => {
          await prisma.issuePDF.update({
            data: previousPdf,
            select: { id: true },
            where: { id: pdfId },
          })
          await dropStored()
        },
        onCommitted: () => deletePdfObject(previousPdf.id),
        onRefused: dropStored,
        writes: [
          prisma.issuePDF.update({
            data: {
              contentType: PDF_CONTENT_TYPE,
              fileName: fileName ?? previousPdf.fileName,
              id: pdfId,
              originalFileName: file.name,
              uploadedAt: new Date(),
            },
            select: { id: true },
            where: { id: previousPdf.id },
          }),
        ],
      }
    },
    tabId,
  })
}
