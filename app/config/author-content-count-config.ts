import type { CountForms } from '~/config/list-noun-config'

/**
 * The content an author can stand on, by its relation on `Author`, in the
 * order the „nejde smazat“ sentence names it (design 28g).
 */
export const AUTHOR_CONTENT_TYPES = [
  'articles',
  'articleCategories',
  'articleTags',
  'issues',
  'podcasts',
  'podcastEpisodes',
] as const

export type AuthorContentType = (typeof AUTHOR_CONTENT_TYPES)[number]

const genitiveForms = (one: string, other: string): CountForms => ({
  few: other,
  many: other,
  one,
  other,
  two: other,
  zero: other,
})

/**
 * Each content noun in the genitive after „u“: „Autor je uveden u 1 článku
 * a 2 rubrik.“ (28g, copy 9w0473vu).
 */
export const AUTHOR_CONTENT_COUNT_FORMS: Record<AuthorContentType, CountForms> =
  {
    articleCategories: genitiveForms('rubriky', 'rubrik'),
    articles: genitiveForms('článku', 'článků'),
    articleTags: genitiveForms('štítku', 'štítků'),
    issues: genitiveForms('čísla', 'čísel'),
    podcastEpisodes: genitiveForms('epizody', 'epizod'),
    podcasts: genitiveForms('podcastu', 'podcastů'),
  }
