import { createPublisherReference } from '~/utils/structured-data/create-publisher-reference'

type ArticleStructuredDataOptions = {
  authors: Array<{ name: string }>
  baseUrl: string
  categories: Array<{ name: string }>
  dateModified: string
  datePublished: string | null
  description: string | null
  imageUrl: string | null
  tags: Array<{ name: string }>
  title: string
  url: string
}

/**
 * Generates the Schema.org Article structured data for an article detail page.
 *
 * Fields without data are left out entirely — Google warns on null or empty
 * values.
 *
 * @param options.dateModified - ISO 8601 `updatedAt`; on a public article it is
 *   the last publication, since a published article cannot be edited in place
 * @param options.datePublished - ISO 8601 `publishedAt`, or `null` for a draft
 * @param options.description - The perex, or `null` when the author wrote none
 * @param options.imageUrl - Absolute share-image URL, or `null` without a
 *   featured image
 * @param options.url - Absolute URL of the article page
 * @returns JSON-LD object conforming to Schema.org Article
 *
 * @see https://schema.org/Article
 */
export const createArticleStructuredData = ({
  authors,
  baseUrl,
  categories,
  dateModified,
  datePublished,
  description,
  imageUrl,
  tags,
  title,
  url,
}: ArticleStructuredDataOptions) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    ...(categories.length > 0 && {
      articleSection: categories.map((category) => category.name),
    }),
    author: authors.map((author) => ({ '@type': 'Person', name: author.name })),
    dateModified,
    ...(datePublished && { datePublished }),
    ...(description && { description }),
    headline: title,
    ...(imageUrl && { image: imageUrl }),
    inLanguage: 'cs',
    ...(tags.length > 0 && {
      keywords: tags.map((tag) => tag.name).join(', '),
    }),
    mainEntityOfPage: url,
    publisher: createPublisherReference(baseUrl),
  }
}
