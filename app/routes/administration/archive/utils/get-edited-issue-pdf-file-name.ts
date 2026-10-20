import type { ContentState } from '@generated/prisma/enums'

import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'

type IssueNumber = {
  year: number
  order: number
  supplementSlug: string
}

/**
 * The PDF's name after an edit. The file is named by the number, so it is
 * renamed only when the year, order or supplement changes; otherwise the stored
 * name stays, an older one included, and so does an address already shared.
 * The number changes only on a draft (design 26c); outside one the name stays.
 *
 * @param stored - The issue's number and state before the edit and its PDF's
 *   name, `null` without a PDF.
 * @param edited - The number the form sends.
 * @returns The name to store.
 */
export const getEditedIssuePdfFileName = (
  stored: IssueNumber & { pdfFileName: string | null; state: ContentState },
  edited: IssueNumber,
): string => {
  if (stored.pdfFileName !== null && stored.state !== 'draft') {
    return stored.pdfFileName
  }

  const isNumberChanged =
    edited.year !== stored.year ||
    edited.order !== stored.order ||
    edited.supplementSlug !== stored.supplementSlug

  return isNumberChanged || stored.pdfFileName === null
    ? getIssuePdfFileName(edited)
    : stored.pdfFileName
}
