/** URL search param carrying how many items the page currently renders. */
export const LIMIT_PARAM = 'limit'

/**
 * The limit a list starts with, and how much each "load more" adds to it.
 * These lists do not paginate — there is one growing limit, no page numbers.
 *
 * Kept low on purpose: tiles enter with a chained fade, and a tile at
 * `opacity: 0` is not an LCP candidate, so the whole chain is paid in LCP. It
 * doubles as the number of tiles chained on load — anything past it renders
 * below the fold and is left to reveal on scroll instead.
 */
export const LIMIT_STEP = 12
