const DIGITS_ONLY = /^\d+$/

/**
 * Reads a search param that must be a positive whole number, such as a page
 * number or a load-more limit.
 *
 * @param searchParams - The URL's search params.
 * @param name - The param to read.
 * @param fallback - Returned when the param is missing or not a positive
 *   integer (non-numeric, fractional, signed, zero, or past the safe range).
 * @returns The parsed value, or `fallback`.
 */
export const parsePositiveIntegerParam = (
  searchParams: URLSearchParams,
  name: string,
  fallback: number,
): number => {
  const rawValue = searchParams.get(name)

  if (rawValue === null || !DIGITS_ONLY.test(rawValue)) return fallback

  const value = Number(rawValue)

  return Number.isSafeInteger(value) && value >= 1 ? value : fallback
}
