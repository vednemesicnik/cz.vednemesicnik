import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'
import { getIssueTitle } from '~/utils/issue/get-issue-title'

type Options = {
  year: number | null
  order: number | null
  name: string | null
  supplement: string | null
  /** The published main issue's name, which a supplement names (wo02u3xq). */
  publishedMainIssueName: string | null
  /** The PDF's name after this edit, `null` without a full number. */
  pdfFileName: string | null
}

type IssueWebPreview = {
  /** The title the archive shows, `null` when it can't be put together. */
  title: string | null
  /** The order beside a named main issue's title (26c). */
  orderLabel: string | null
  /** The PDF's address, never a partial one. */
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

/**
 * *Na webu jako* in the issue editor (design 26c, wo02u3xq, copy ey73zhul): the
 * title as a reader sees it, with the order beside a named issue, and the
 * PDF's address. Without the year or the order, whatever title can still be
 * put together, and what is missing.
 *
 * @returns `{ title: 'podzim 2026', orderLabel: '4/2026', address:
 *   '/archive/VDM-2026-4.pdf' }`, or without the order `{ title: 'podzim
 *   2026', address: null, missingNote }`.
 */
export const getIssueWebPreview = ({
  year,
  order,
  name,
  supplement,
  publishedMainIssueName,
  pdfFileName,
}: Options): IssueWebPreview => {
  const orderLabel = getIssueOrderLabel({ order, year })

  if (orderLabel === null) {
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

  return {
    address: pdfFileName === null ? null : `/archive/${pdfFileName}`,
    missingNote: null,
    orderLabel: !supplement && name ? orderLabel : null,
    title,
  }
}
