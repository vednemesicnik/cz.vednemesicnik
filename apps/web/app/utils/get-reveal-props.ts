import { REVEAL_CHAIN_LENGTH } from '~/config/reveal-config'

/**
 * Picks the entry animation for one tile.
 *
 * The chain covers `REVEAL_CHAIN_LENGTH` tiles, what the LCP budget allows;
 * anything past it renders below the fold and is left to reveal on scroll.
 *
 * @param position Tile index on the whole page, across every grid on it.
 */
export const getRevealProps = (position: number) => {
  if (position >= REVEAL_CHAIN_LENGTH) return { reveal: 'scroll' as const }

  return { reveal: 'stagger' as const, staggerIndex: position }
}
