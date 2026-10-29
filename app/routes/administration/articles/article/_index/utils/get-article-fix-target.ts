type Options = {
  title: string
  slug: string | null
  perex: string | null
  content: string
  authorCount: number
  /** In the gallery's order. */
  images: { id: string; altText: string }[]
  /** Another article holds the address as published (log 0039). */
  isSlugTaken: boolean
}

export type ArticleFixTarget =
  | { field: 'title' | 'slug' | 'content' | 'perex' | 'authors' }
  | { field: 'imageAlt'; imageId: string }

const isBlank = (value: string | null) => value === null || value.trim() === ''

/**
 * Where *Upravit v editoru* opens the article editor (design 23h, 6dlnv2de):
 * at the first item of the missing-content list, in the order of
 * `getMissingArticleContent` — the first empty field, the alt text of the
 * first image without one — and in *Adresa* when only the address is taken.
 *
 * @param options - The article's fields, its author count, its images and
 *   whether its address is taken.
 * @returns The field to focus, with the image for an alt text; `null` when
 *   nothing is to fix.
 */
export const getArticleFixTarget = ({
  title,
  slug,
  perex,
  content,
  authorCount,
  images,
  isSlugTaken,
}: Options): ArticleFixTarget | null => {
  if (isBlank(title)) return { field: 'title' }
  if (isBlank(slug)) return { field: 'slug' }
  if (isBlank(content)) return { field: 'content' }
  if (isBlank(perex)) return { field: 'perex' }
  if (authorCount === 0) return { field: 'authors' }

  const imageWithoutAlt = images.find((image) => isBlank(image.altText))
  if (imageWithoutAlt !== undefined) {
    return { field: 'imageAlt', imageId: imageWithoutAlt.id }
  }

  if (isSlugTaken) return { field: 'slug' }

  return null
}
