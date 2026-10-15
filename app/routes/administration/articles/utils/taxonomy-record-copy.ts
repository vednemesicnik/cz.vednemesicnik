/**
 * The words of a category's or tag's list row, add and edit pages, confirmations,
 * toasts and errors (design 25a, 25c, 25d, 25e): the same screens, feminine for a
 * category, masculine for a tag.
 */
export type TaxonomyRecordCopy = {
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
  toasts: {
    approved: string
    archived: string
    created: string
    published: string
    saved: string
    submitted: string
  }
}
