import { ASSOCIATION_AUTHOR_WHERE } from '~/utils/association-author-where'

type Author = {
  user: { role: { name: string } } | null
}

/**
 * Whether an author already read is the association's, by the same rule as
 * {@link ASSOCIATION_AUTHOR_WHERE} (log 0026), so the rule changes in one place.
 *
 * @param author - The author with its account's role.
 * @returns `true` for the author of the Owner's account.
 */
export const isAssociationAuthor = (author: Author): boolean =>
  author.user?.role.name === ASSOCIATION_AUTHOR_WHERE.user.role.name
