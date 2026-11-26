type Options = {
  number: number | null
  title: string
}

/**
 * The episode cover's alt text, composed from the title as the issue's; the
 * editors don't write it (design 27d, as 26c). No `#` before the number, and a
 * colon before the title, so a title starting with a digit doesn't read as
 * the number (copy 0s5hhaqz).
 *
 * @param options - The episode's number and title.
 * @returns „Obálka epizody 14: Školník, který ví všechno“, without a number
 *   „Obálka epizody: Školník, který ví všechno“, without a title „Obálka
 *   epizody 14“, or „Obálka epizody“.
 */
export const getEpisodeCoverAltText = ({ number, title }: Options): string => {
  const trimmedTitle = title.trim()
  const numberPart = number === null ? '' : ` ${number}`
  const titlePart = trimmedTitle === '' ? '' : `: ${trimmedTitle}`

  return `Obálka epizody${numberPart}${titlePart}`
}
