/**
 * Tells whether a requested page lies past the last page of a list. Page 1
 * always exists, so an empty list still renders its empty state there.
 *
 * @param currentPage - The requested page, a positive integer.
 * @param totalPages - The pages the list has; 0 for an empty list.
 * @returns `true` when the page does not exist.
 */
export const isPagePastLast = (
  currentPage: number,
  totalPages: number,
): boolean => currentPage > Math.max(totalPages, 1)
