type Options = {
  number: number | null
  title: string
}

/**
 * An episode by its number and title, as the web shows it (design 27b, 27c).
 * A draft may lack its number (27h), and then the title stands alone.
 *
 * @param options - The episode's number and title.
 * @returns „#13 Paní Vránová o třiceti letech za katedrou“, or the title.
 */
export const formatEpisodeTitle = ({ number, title }: Options) =>
  number === null ? title : `#${number} ${title}`
