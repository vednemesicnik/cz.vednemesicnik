import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'

/** The fields that make the issue's number (log 0034). */
export type IssueNumberField = 'year' | 'order' | 'supplement'

type Options = {
  year: number
  order: number
  supplement: string | null
  /** The field the editor changed last, where the error stands. */
  field: IssueNumberField
}

/**
 * The field error for a number another issue holds as published (design 26d,
 * copy q34nuf6c and d288tkdf): a supplement names its name, a changed year
 * asks for the year or the order, otherwise the order.
 *
 * @returns E.g. „Zadejte jiné pořadí — číslo 3/2026 je obsazené.“
 */
export const getTakenIssueNumberMessage = ({
  year,
  order,
  supplement,
  field,
}: Options): string => {
  const orderLabel = getIssueOrderLabel({ order, year })

  if (supplement) {
    return `Zkontrolujte rok, pořadí a název doplňku — název „${supplement}“ je pro číslo ${orderLabel} obsazený.`
  }

  return field === 'year'
    ? `Zadejte jiný rok nebo pořadí — číslo ${orderLabel} je obsazené.`
    : `Zadejte jiné pořadí — číslo ${orderLabel} je obsazené.`
}
