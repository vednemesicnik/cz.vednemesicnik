import { TAKEN_SLUG_ITEM } from './taken-slug-item'

const pluralRules = new Intl.PluralRules('cs')

const MISSING_ALT_TEXT: Record<Intl.LDMLPluralRule, string> = {
  few: 'obrázky nemají alt text.',
  many: 'obrázku nemá alt text.',
  one: 'obrázek nemá alt text.',
  other: 'obrázků nemá alt text.',
  two: 'obrázků nemá alt text.',
  zero: 'obrázků nemá alt text.',
}

type Options = {
  title: string
  slug: string | null
  perex: string | null
  content: string
  authorCount: number
  images: { altText: string }[]
  /** Another article holds the address as published (log 0039). */
  isSlugTaken: boolean
}

const isBlank = (value: string | null) => value === null || value.trim() === ''

/**
 * What an article still lacks before it can be submitted for review, approved
 * or published (design 23h). Completeness is checked then, not on save; an
 * address another article holds is the last item (log 0039).
 *
 * @param options - The article's fields, its author count, its images and
 *   whether its address is taken.
 * @returns One sentence per missing item, in the order of 23h; empty when complete.
 */
export const getMissingArticleContent = ({
  title,
  slug,
  perex,
  content,
  authorCount,
  images,
  isSlugTaken,
}: Options): string[] => {
  const missing: string[] = []

  if (isBlank(title)) missing.push('Chybí název.')
  if (isBlank(slug)) missing.push('Chybí adresa.')
  if (isBlank(content)) missing.push('Chybí text.')
  if (isBlank(perex)) missing.push('Chybí perex.')
  if (authorCount === 0) missing.push('Článek nemá autora.')

  const missingAltTextCount = images.filter((image) =>
    isBlank(image.altText),
  ).length

  if (missingAltTextCount > 0) {
    missing.push(
      `${missingAltTextCount} ${MISSING_ALT_TEXT[pluralRules.select(missingAltTextCount)]}`,
    )
  }

  if (isSlugTaken) missing.push(TAKEN_SLUG_ITEM)

  return missing
}
