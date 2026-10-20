import type { ContentState } from '@generated/prisma/enums'

import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'

type IssueNumber = {
  year: number | null
  order: number | null
  supplementSlug: string
}

/**
 * The PDF's name after an edit. The file is named by the number, so it is
 * renamed only when the year, order or supplement changes; otherwise the stored
 * name stays, an older one included, and so does an address already shared.
 * The number changes only on a draft (design 26c); outside one the name stays.
 * A number without the year or the order names nothing: the stored name stays.
 *
 * @param stored - The issue's number and state before the edit and its PDF's
 *   name, `null` without a PDF.
 * @param edited - The number the form sends.
 * @returns The name to store, or `null` for an issue without a PDF and
 *   without a full number.
 */
export const getEditedIssuePdfFileName = (
  stored: IssueNumber & { pdfFileName: string | null; state: ContentState },
  edited: IssueNumber,
): string | null => {
  const { year, order, supplementSlug } = edited

  if (
    (stored.pdfFileName !== null && stored.state !== 'draft') ||
    year === null ||
    order === null
  ) {
    return stored.pdfFileName
  }

  const isNumberChanged =
    year !== stored.year ||
    order !== stored.order ||
    supplementSlug !== stored.supplementSlug

  return isNumberChanged || stored.pdfFileName === null
    ? getIssuePdfFileName({ order, supplementSlug, year })
    : stored.pdfFileName
}
