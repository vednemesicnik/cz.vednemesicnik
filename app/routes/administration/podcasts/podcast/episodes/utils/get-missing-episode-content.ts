import { TAKEN_SLUG_ITEM } from '~/routes/administration/articles/article/_index/utils/slug-items'

import { formatIncompleteEpisodeLinksItem } from './format-incomplete-episode-links-item'

const listFormat = new Intl.ListFormat('cs', { type: 'conjunction' })

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

/**
 * What an episode still lacks before it can be submitted, approved or
 * published (design 27h, copy vcpswvfg, li7oq1zu), one sentence each in the
 * editor's order: what is missing (the number, the title, the description and
 * a link, the last only when none is saved), the incomplete links, the taken
 * number and the taken address. The cover is not required.
 *
 * @param options - The episode's stored values and whether its number and
 *   address are taken.
 * @returns E.g. „Chybí popis.“, „1 odkaz nemá název platformy.“, „Číslo 13 je
 *   obsazené.“, „Adresa je obsazená.“; empty when complete.
 */
export const getMissingEpisodeContent = ({
  number,
  title,
  description,
  links,
  isNumberTaken,
  isSlugTaken,
}: Options): string[] => {
  const missing: string[] = []

  if (number === null) missing.push('číslo')
  if (title.trim() === '') missing.push('název')
  if (description.trim() === '') missing.push('popis')
  if (links.length === 0) missing.push('odkaz na epizodu')

  const incompleteLinks = formatIncompleteEpisodeLinksItem(links)

  return [
    ...(missing.length === 0 ? [] : [`Chybí ${listFormat.format(missing)}.`]),
    ...(incompleteLinks === null ? [] : [incompleteLinks]),
    // Only a number can be taken.
    ...(isNumberTaken && number !== null
      ? [`Číslo ${number} je obsazené.`]
      : []),
    ...(isSlugTaken ? [TAKEN_SLUG_ITEM] : []),
  ]
}
