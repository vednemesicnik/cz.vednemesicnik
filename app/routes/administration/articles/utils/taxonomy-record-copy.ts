/**
 * The words of a category's or tag's dialog, toasts and errors (design 25c,
 * 25e): the same screens, feminine for a category, masculine for a tag.
 */
export type TaxonomyRecordCopy = {
  newTitle: string
  editTitle: string
  /** The public address the record's slug is appended to. */
  publicPath: string
  republishHint: string
  takenName: string
  takenSlug: string
  toasts: {
    created: string
    published: string
    saved: string
    submitted: string
  }
}
