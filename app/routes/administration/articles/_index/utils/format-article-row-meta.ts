type Options = {
  authorNames: string[]
  categoryNames: string[]
  showAuthor: boolean
}

/**
 * The third line of a list row on a phone (design 22g): all authors, then the
 * first category with the count of the rest (2txmjnaq).
 *
 * @param options.showAuthor - False for a Contributor, who is always the
 *   author (22i).
 * @returns „Anna Dvořáková, Jakub Novák · Rozhovor +1“, either half alone, or
 *   null when there is neither.
 */
export const formatArticleRowMeta = ({
  authorNames,
  categoryNames,
  showAuthor,
}: Options) => {
  const [firstCategory, ...otherCategories] = categoryNames
  const authors =
    showAuthor && authorNames.length > 0 ? authorNames.join(', ') : null
  const categories =
    firstCategory === undefined
      ? null
      : otherCategories.length > 0
        ? `${firstCategory} +${otherCategories.length}`
        : firstCategory

  const parts = [authors, categories].filter((part) => part !== null)

  return parts.length > 0 ? parts.join(' · ') : null
}
