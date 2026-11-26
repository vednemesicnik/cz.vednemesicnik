/**
 * Shortens a text to whole words within a length, with „…“ after a cut, as a
 * page description from the start of a longer text (design 13c, a8321eu5).
 *
 * @param text - The text to shorten.
 * @param maxLength - The longest result, the ellipsis included.
 * @returns The text as it is when it fits, otherwise its words up to the
 *   length and „…“; a first word longer than the length is cut inside it.
 */
export const truncateAtWordBoundary = (text: string, maxLength: number) => {
  const trimmed = text.trim().replace(/\s+/g, ' ')

  if (trimmed.length <= maxLength) return trimmed

  const room = trimmed.slice(0, maxLength - 1)
  const lastSpace = room.lastIndexOf(' ')
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room

  return `${cut.replace(/[\s,.;:–-]+$/, '')}…`
}
