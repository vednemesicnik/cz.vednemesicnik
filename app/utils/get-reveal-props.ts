import { LIMIT_STEP } from '~/config/load-more-config'

/**
 * Picks the entry animation for one item of a growing list.
 *
 * The chain covers exactly one batch — `LIMIT_STEP` items — because that is
 * what a "load more" appends and what the LCP budget allows; anything past it
 * renders below the fold and is left to reveal on scroll.
 *
 * @param position Item index relative to the batch being revealed — negative
 * for items an earlier render already revealed.
 */
export const getRevealProps = (position: number) => {
  if (position < 0) return { reveal: 'none' as const }
  if (position >= LIMIT_STEP) return { reveal: 'scroll' as const }

  return { reveal: 'stagger' as const, staggerIndex: position }
}
