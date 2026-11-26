import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'

type Options = {
  year: number
  order: number
  supplement: string | null
}

/**
 * The missing-content item for a number another issue holds as published
 * (design 26e, copy q34nuf6c), a sentence of its own after „Chybí …“.
 *
 * @returns „Číslo 3/2026 je obsazené.“, or for a supplement „Název
 *   „Maturitní ples“ je pro číslo 2/2026 obsazený.“
 */
export const getTakenIssueNumberItem = ({
  year,
  order,
  supplement,
}: Options): string => {
  const orderLabel = getIssueOrderLabel({ order, year })

  return supplement
    ? `Název „${supplement}“ je pro číslo ${orderLabel} obsazený.`
    : `Číslo ${orderLabel} je obsazené.`
}
