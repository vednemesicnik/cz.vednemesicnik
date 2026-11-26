/**
 * How many tiles enter with the chained fade on load.
 *
 * Kept low on purpose: a tile at `opacity: 0` is not an LCP candidate, so the
 * whole chain is paid in LCP. Anything past it renders below the fold and is
 * left to reveal on scroll instead.
 */
export const REVEAL_CHAIN_LENGTH = 12
