import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'

type IssueNumber = {
  year: number
  order: number
  supplementSlug: string
}

/**
 * The PDF's name after an edit. The file is named by the number, so it is
 * renamed only when the year, order or supplement changes; otherwise the stored
 * name stays, an older one included, and so does an address already shared
 * (design 26c).
 *
 * @param stored - The issue's number before the edit and its PDF's name, `null`
 *   without a PDF.
 * @param edited - The number the form sends.
 * @returns The name to store.
 */
export const getEditedIssuePdfFileName = (
  stored: IssueNumber & { pdfFileName: string | null },
  edited: IssueNumber,
): string => {
  const isNumberChanged =
    edited.year !== stored.year ||
    edited.order !== stored.order ||
    edited.supplementSlug !== stored.supplementSlug

  return isNumberChanged || stored.pdfFileName === null
    ? getIssuePdfFileName(edited)
    : stored.pdfFileName
}
