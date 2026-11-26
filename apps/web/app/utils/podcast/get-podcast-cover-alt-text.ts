/**
 * The podcast cover's alt text, composed from the title as before the editor
 * (27e); the editor doesn't write it.
 *
 * @param title - The podcast's title.
 * @returns „Obálka podcastu Přestávka“, or „Obálka podcastu“ without a title.
 */
export const getPodcastCoverAltText = (title: string): string => {
  const trimmedTitle = title.trim()

  return trimmedTitle === ''
    ? 'Obálka podcastu'
    : `Obálka podcastu ${trimmedTitle}`
}
