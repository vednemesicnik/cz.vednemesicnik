import { prisma } from '~/utils/db.server'
import { deleteImage } from '~/utils/image-store/store-image.server'
import { deletePdfObject } from '~/utils/pdf-store/store-pdf.server'

import type { IssueFileKind } from '../_schema'
import {
  type FileChangeResult,
  saveIssueFileChange,
} from './save-issue-file-change.server'

type Options = {
  issueId: string
  tabId: string
  kind: IssueFileKind
}

/**
 * Removes the issue's cover or PDF with its files, which go only after the row
 * is deleted. The editor sends it after cancelling a new file, because the
 * abort loses an answer already on its way (log 0029); like that upload,
 * it lands after *Zavřít* released the hold, never over someone else's.
 *
 * @param request - The action's request.
 * @param options - The issue, the tab and which file.
 * @returns As `saveIssueFileChange`; a file that does not exist counts as
 *   removed.
 */
export async function removeIssueFile(
  request: Request,
  { issueId, tabId, kind }: Options,
): Promise<FileChangeResult> {
  return saveIssueFileChange(request, {
    issueId,
    landsWithoutHold: true,
    prepare: async (issue) => {
      if (kind === 'cover') {
        // Already gone, or never landed: the removal holds.
        if (issue.cover === null) return { writes: [] }
        const coverId = issue.cover.id
        return {
          onCommitted: () => deleteImage(coverId),
          writes: [
            prisma.issueCover.delete({
              select: { id: true },
              where: { id: coverId },
            }),
          ],
        }
      }

      if (issue.pdf === null) return { writes: [] }
      const pdfId = issue.pdf.id
      return {
        onCommitted: () => deletePdfObject(pdfId),
        writes: [
          prisma.issuePDF.delete({
            select: { id: true },
            where: { id: pdfId },
          }),
        ],
      }
    },
    tabId,
  })
}
