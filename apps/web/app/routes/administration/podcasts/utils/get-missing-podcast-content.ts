import { TAKEN_SLUG_ITEM } from '~/routes/administration/articles/article/_index/utils/slug-items'

const listFormat = new Intl.ListFormat('cs', { type: 'conjunction' })

type Options = {
  title: string
  slug: string
  description: string
  hasCover: boolean
  /** Whether another podcast holds the address as published (log 0039). */
  isSlugTaken: boolean
}

/**
 * What a podcast still lacks before it can be submitted, approved or
 * published (design 27i, tly4a163, 2whigbz5): what is missing in one sentence
 * in the editor's order — the title, the address, the description and the
 * cover, which episodes without their own take over (27e) — and the taken
 * address as its own sentence after it.
 *
 * @param options - The podcast's stored values and whether its address is
 *   taken.
 * @returns E.g. „Chybí obálka.“, „Chybí název, adresa, popis a obálka.“,
 *   „Adresa je obsazená.“; empty when complete.
 */
export const getMissingPodcastContent = ({
  title,
  slug,
  description,
  hasCover,
  isSlugTaken,
}: Options): string[] => {
  const missing: string[] = []

  if (title.trim() === '') missing.push('název')
  if (slug === '') missing.push('adresa')
  if (description.trim() === '') missing.push('popis')
  if (!hasCover) missing.push('obálka')

  return [
    ...(missing.length === 0 ? [] : [`Chybí ${listFormat.format(missing)}.`]),
    // Only an address can be taken.
    ...(isSlugTaken && slug !== '' ? [TAKEN_SLUG_ITEM] : []),
  ]
}
