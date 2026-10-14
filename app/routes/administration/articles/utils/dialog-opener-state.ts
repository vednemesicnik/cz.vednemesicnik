/**
 * The link state of a record dialog opened from a page of the app: closing it
 * goes back to that page (design 30c, 39aqwklv), a list row included. Without
 * it, as from a shared link, closing goes to the dialog's parent.
 */
export const DIALOG_OPENER_STATE = { opensDialog: true } as const
