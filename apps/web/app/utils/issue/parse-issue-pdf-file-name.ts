import type { IssueNumberKey } from './get-issue-published-number'

// Only a name `getIssuePdfFileName` gives: no leading zero in the order, and a
// slug as `slugify` makes it.
const PDF_FILE_NAME_PATTERN =
  /^VDM-(\d{4})-([1-9]\d*)(?:-([a-z0-9]+(?:-[a-z0-9]+)*))?\.pdf$/

/**
 * The number a PDF's name stands for (`getIssuePdfFileName`), so a draft is
 * found by its provisional address (26j, log 0039).
 *
 * @param fileName - The name in the address, e.g. `VDM-2026-4.pdf`.
 * @returns The year, order and supplement slug, or `null` for a name no
 *   number gives.
 */
export const parseIssuePdfFileName = (
  fileName: string,
): IssueNumberKey | null => {
  const match = PDF_FILE_NAME_PATTERN.exec(fileName)

  return match === null
    ? null
    : {
        order: Number(match[2]),
        supplementSlug: match[3] ?? '',
        year: Number(match[1]),
      }
}
