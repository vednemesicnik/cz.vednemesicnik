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

/**
 * What *Použít …* fills in: the whole number, the order of the year typed
 * (`year` names that year and stays as it is), or the year alone.
 */
export type IssueNumberSuggestion =
  | { kind: 'number'; year: number; order: number }
  | { kind: 'order'; year: number; order: number }
  | { kind: 'year'; year: number }

const isEmpty = (value: string) => value.trim() === ''

// Read as the schema reads them: a year of four digits, an order from 1.
const readInteger = (value: string, isValid: (number: number) => boolean) => {
  const number = Number(value)
  return isEmpty(value) || !Number.isInteger(number) || !isValid(number)
    ? null
    : number
}
const readYear = (value: string) =>
  readInteger(value, (year) => year >= 1000 && year <= 9999)
const readOrder = (value: string) => readInteger(value, (order) => order >= 1)

/**
 * The number the issue editor offers for empty fields (decision 0034, design
 * 26c): this year and its next free order, the next free order of the year
 * typed, or this year for an order typed alone. Nothing for a supplement,
 * which takes its issue's order, for a value that can't be read yet (a year
 * half typed), or when both fields are filled.
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
    return {
      kind: 'number',
      order: nextFreeOrder(currentYear),
      year: currentYear,
    }
  }

  if (isEmpty(order)) {
    const typedYear = readYear(year)
    return typedYear === null
      ? null
      : { kind: 'order', order: nextFreeOrder(typedYear), year: typedYear }
  }

  if (isEmpty(year) && readOrder(order) !== null) {
    return { kind: 'year', year: currentYear }
  }

  return null
}
