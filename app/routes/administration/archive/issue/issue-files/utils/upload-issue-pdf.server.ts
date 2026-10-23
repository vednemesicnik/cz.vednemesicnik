import { createId } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { ISSUE_FILE_CONFIG } from '~/config/issue-file-config'
import { prisma } from '~/utils/db.server'
import {
  deletePdfObject,
  PDF_CONTENT_TYPE,
  storePdf,
} from '~/utils/pdf-store/store-pdf.server'

import {
  type FileChangeResult,
  saveIssueFileChange,
} from './save-issue-file-change.server'

type Options = {
  issueId: string
  tabId: string
  file: File
}

/**
 * Stores a picked PDF as soon as it is chosen (design 26c, log 0029).
 * Every upload is stored under a fresh id, so a replacement leaves the
 * previous PDF untouched until the row points at the new one; the old object
 * goes only after the commit. A new PDF has no name until publish gives it
 * one (log 0039); a replacement keeps the name of the one it replaces. The editor can cancel it until it saves: a
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
