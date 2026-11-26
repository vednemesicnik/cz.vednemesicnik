type Options = {
  title: string
  slug: string
  description: string
  hasCover: boolean
  /** Whether another podcast holds the address as published (log 0039). */
  isSlugTaken: boolean
}

export type PodcastFixTarget = 'title' | 'slug' | 'description' | 'cover'

/**
 * Where *Upravit v editoru* opens the podcast editor (design 27i, as 23h and
 * 27h, 9r499rz5): at the first thing the missing-content sentence names, in
 * the order of `getMissingPodcastContent`, and in *Adresa* when only the
 * address is taken.
 *
 * @param options - The podcast's stored values and whether its address is
 *   taken.
 * @returns The field to focus; `null` when nothing is to fix.
 */
export const getPodcastFixTarget = ({
  title,
  slug,
  description,
  hasCover,
  isSlugTaken,
}: Options): PodcastFixTarget | null => {
  if (title.trim() === '') return 'title'
  if (slug === '') return 'slug'
  if (description.trim() === '') return 'description'
  if (!hasCover) return 'cover'
  if (isSlugTaken) return 'slug'

  return null
}
