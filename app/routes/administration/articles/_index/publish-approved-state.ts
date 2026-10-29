// Server-free, so the dashboard's link and the list both import it.

/**
 * The navigation state with which the dashboard opens the article list to
 * publish the approved in order (design 21a): every approved article
 * selected and the 22c dialog open. State, not the address, so a reload or
 * going back does not open it again.
 */
export const PUBLISH_APPROVED_STATE = { publishApproved: true } as const
