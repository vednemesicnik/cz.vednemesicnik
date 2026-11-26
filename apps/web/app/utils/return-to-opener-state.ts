/**
 * The link state of a record's add or edit page opened from a page of the app:
 * saving or Zrušit goes back to that page (design 30c, 39aqwklv), a list row
 * included. Without it, as from a shared link, they go to the record's parent.
 */
export const RETURN_TO_OPENER_STATE = { returnsToOpener: true } as const
