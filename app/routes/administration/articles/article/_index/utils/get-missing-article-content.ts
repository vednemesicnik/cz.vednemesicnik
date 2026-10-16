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
}

const isBlank = (value: string | null) => value === null || value.trim() === ''

/**
 * What an article still lacks before it can be submitted for review or published
 * (design 23h). Completeness is checked on submit and publish, not on save.
 *
 * @param options - The article's fields, its author count and its images.
 * @returns One sentence per missing item, in the order of 23h; empty when complete.
 */
export const getMissingArticleContent = ({
  title,
  slug,
  perex,
  content,
  authorCount,
  images,
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

  return missing
}
