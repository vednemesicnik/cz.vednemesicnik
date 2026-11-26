import { isValidEpisodeLinkUrl } from './is-valid-episode-link-url'

type Options = {
  number: number | null
  title: string
  description: string
  links: readonly { label: string; url: string }[]
  /** Whether another episode of the podcast holds the number as published (log 0039). */
  isNumberTaken: boolean
  /** Whether another episode of the podcast holds the address as published (log 0047). */
  isSlugTaken: boolean
}

export type EpisodeFixTarget =
  | { field: 'title' | 'description' | 'number' | 'slug' }
  | { field: 'linkLabel' | 'linkUrl'; index: number }

/**
 * Where *Upravit v editoru* opens the episode editor (design 27h): at the
 * field of the first sentence, in the editor's order — the title, the
 * description and the links, then the number — and at the first incomplete
 * link's empty platform name or its address with the error. An episode
 * without a stored link opens at the empty row's address, where a new row
 * takes the focus (27d). A taken number or address opens its field.
 *
 * @param options - The episode's stored values and whether its number and
 *   address are taken.
 * @returns The field to focus, with the link row; `null` when nothing is to
 *   fix.
 */
export const getEpisodeFixTarget = ({
  number,
  title,
  description,
  links,
  isNumberTaken,
  isSlugTaken,
}: Options): EpisodeFixTarget | null => {
  if (title.trim() === '') return { field: 'title' }
  if (description.trim() === '') return { field: 'description' }
  if (links.length === 0) return { field: 'linkUrl', index: 0 }

  const incompleteIndex = links.findIndex(
    (link) => link.label.trim() === '' || !isValidEpisodeLinkUrl(link.url),
  )
  if (incompleteIndex !== -1) {
    return {
      field:
        links[incompleteIndex].label.trim() === '' ? 'linkLabel' : 'linkUrl',
      index: incompleteIndex,
    }
  }

  if (number === null || isNumberTaken) return { field: 'number' }
  if (isSlugTaken) return { field: 'slug' }

  return null
}
