/** The edit hold's columns on a content row (decision 0019). */
export type EditHoldColumns = {
  heldByAuthorId: string | null
  heldByTabId: string | null
  heldSince: Date | null
  heldUntil: Date | null
}

/** The tab that holds, or asks for, the edit hold. */
export type EditHoldTab = {
  authorId: string
  tabId: string
}
