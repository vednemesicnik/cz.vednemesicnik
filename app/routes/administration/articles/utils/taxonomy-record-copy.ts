import type { HeaderSentence } from './article-actions'

/**
 * The words of a category's or tag's list row, detail, add and edit pages,
 * confirmations, toasts and errors (design 25a–25e): the same screens, feminine
 * for a category, masculine for a tag.
 */
export type TaxonomyRecordCopy = {
  /** The detail's section of the record's articles (25b). */
  articlesTitle: string
  allArticlesLink: (articleCount: number) => string
  /** The detail header's sentence beside or instead of its buttons (23d). */
  headerSentences: Record<HeaderSentence, string>
  newTitle: string
  editTitle: string
  /** The public address the record's slug is appended to. */
  publicPath: string
  republishHint: string
  takenName: string
  takenSlug: string
  selectLabel: (name: string) => string
  menuLabel: (name: string) => string
  archiveTitle: (name: string) => string
  archiveDescription: string
  deleteTitle: (name: string) => string
  deleteDescription: (articleCount: number) => string
  retractTitle: (name: string) => string
  retractDescription: (publishedArticleCount: number) => string
  /** The bulk delete from the list's selection bar (25g). */
  bulkDelete: {
    /** The count in the title and the button, in the accusative. */
    count: (count: number) => string
    /** The sentence, in the singular for one record. */
    description: (options: { count: number; hasArticles: boolean }) => string
    toast: (deletedCount: number) => string
  }
  toasts: {
    approved: string
    approvedAndPublished: string
    archived: string
    created: string
    published: string
    retracted: string
    saved: string
    submitted: string
  }
}
