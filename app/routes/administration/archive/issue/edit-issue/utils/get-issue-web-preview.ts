import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'
import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'
import { getIssuePublishedNumber } from '~/utils/issue/get-issue-published-number'
import { getIssueTitle } from '~/utils/issue/get-issue-title'
import { slugify } from '~/utils/slugify'

type Options = {
  year: number | null
  order: number | null
  name: string | null
  supplement: string | null
  /** The published main issue's name, which a supplement names (wo02u3xq). */
  publishedMainIssueName: string | null
  /** Whether another issue holds the number as published (log 0039). */
  isNumberTaken: boolean
  /** The number the issue holds since it was published, `null` if never. */
  publishedNumber: string | null
  /** The PDF's stored name, which publish gave it; `null` before. */
  storedPdfFileName: string | null
}

type IssueWebPreview = {
  /** The title the archive shows, `null` when it can't be put together. */
  title: string | null
  /** The order beside a named main issue's title (26c). */
  orderLabel: string | null
  /** The PDF's address, never a partial one; before publish, provisional. */
  address: string | null
  /** What is missing for the rest of the preview. */
  missingNote: string | null
}

// What the preview waits for (copy ey73zhul).
const getMissingNote = (year: number | null, order: number | null) => {
  if (year === null && order === null) {
    return 'Úplný náhled názvu a adresy PDF se zobrazí po doplnění roku a pořadí v roce.'
  }
  if (year === null) {
    return 'Úplný náhled názvu a adresy PDF se zobrazí po doplnění roku.'
  }
  return 'Úplný náhled názvu a adresy PDF se zobrazí po doplnění pořadí v roce.'
}

// Copy d288tkdf.
const TAKEN_NUMBER_NOTE =
  'Náhled adresy PDF se zobrazí po zadání neobsazeného čísla.'
const PROVISIONAL_SUFFIX = ' · předběžná adresa'

/**
 * *Na webu jako* in the issue editor (design 26c, 26j, wo02u3xq, copy ey73zhul
 * and d288tkdf): the title as a reader sees it, with the order beside a named
 * issue, and the PDF's address. Publish names the PDF (log 0039), so until
 * then the address is provisional; the number the issue holds keeps its
 * name. A taken number gets no address. Without the year or the order,
 * whatever title can still be put together, and what is missing.
 *
 * @returns `{ title: 'podzim 2026', orderLabel: '4/2026', address:
 *   '/archive/VDM-2026-4.pdf · předběžná adresa' }`, or without the order
 *   `{ title: 'podzim 2026', address: null, missingNote }`.
 */
export const getIssueWebPreview = ({
  year,
  order,
  name,
  supplement,
  publishedMainIssueName,
  isNumberTaken,
  publishedNumber,
  storedPdfFileName,
}: Options): IssueWebPreview => {
  const orderLabel = getIssueOrderLabel({ order, year })

  if (orderLabel === null || year === null || order === null) {
    return {
      address: null,
      missingNote: getMissingNote(year, order),
      orderLabel: null,
      // Only a named main issue has a title without its number: the name
      // alone without the year, with it when only the order is missing (26j).
      title:
        supplement || !name ? null : year === null ? name : `${name} ${year}`,
    }
  }

  const title = getIssueTitle(
    { name, order, supplement, year },
    publishedMainIssueName,
  )

  const orderLabelBeside = !supplement && name ? orderLabel : null

  if (isNumberTaken) {
    return {
      address: null,
      missingNote: TAKEN_NUMBER_NOTE,
      orderLabel: orderLabelBeside,
      title,
    }
  }

  const number = {
    order,
    supplementSlug: supplement ? slugify(supplement) : '',
    year,
  }

  // Published with this number, the PDF keeps its name (log 0030).
  if (
    storedPdfFileName !== null &&
    publishedNumber === getIssuePublishedNumber(number)
  ) {
    return {
      address: `/archive/${storedPdfFileName}`,
      missingNote: null,
      orderLabel: orderLabelBeside,
      title,
    }
  }

  return {
    address: `/archive/${getIssuePdfFileName(number)}${PROVISIONAL_SUFFIX}`,
    missingNote: null,
    orderLabel: orderLabelBeside,
    title,
  }
}
