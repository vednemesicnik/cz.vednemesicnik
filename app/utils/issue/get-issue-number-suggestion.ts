import { getNextFreeIssueOrder } from './get-next-free-issue-order'

type Options = {
  /** The fields as the editor shows them. */
  year: string
  order: string
  supplement: string
  /** This year in Prague. */
  currentYear: number
  /** The orders of the other main issues, by year. */
  takenOrdersByYear: Readonly<Record<number, readonly number[]>>
}

/** What *Použít …* fills in; `null` leaves that field as it is. */
export type IssueNumberSuggestion = {
  year: number | null
  order: number | null
}

const isEmpty = (value: string) => value.trim() === ''

const readYear = (value: string) => {
  const year = Number(value)
  return isEmpty(value) || !Number.isInteger(year) ? null : year
}

/**
 * The number the issue editor offers for empty fields (decision 0034): this
 * year and its next free order, the next free order of the year typed, or
 * this year for an order typed alone. Nothing for a supplement, which takes
 * its issue's order, or when both fields are filled.
 *
 * @param options - The year, order and supplement shown, this year, and the
 *   other main issues' orders.
 * @returns What to fill in, or `null` when there is nothing to offer.
 */
export const getIssueNumberSuggestion = ({
  year,
  order,
  supplement,
  currentYear,
  takenOrdersByYear,
}: Options): IssueNumberSuggestion | null => {
  if (!isEmpty(supplement)) return null

  const nextFreeOrder = (forYear: number) =>
    getNextFreeIssueOrder(takenOrdersByYear[forYear] ?? [])

  if (isEmpty(year) && isEmpty(order)) {
    return { order: nextFreeOrder(currentYear), year: currentYear }
  }

  if (isEmpty(order)) {
    const typedYear = readYear(year)
    return typedYear === null
      ? null
      : { order: nextFreeOrder(typedYear), year: null }
  }

  if (isEmpty(year)) return { order: null, year: currentYear }

  return null
}
