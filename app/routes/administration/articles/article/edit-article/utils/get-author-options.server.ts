import { ASSOCIATION_AUTHOR_WHERE } from '~/utils/association-author-where'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorRoleLabel } from '~/utils/role-labels'

/**
 * Every author an article's authors are chosen from, by name (design 24j):
 * the search goes through the whole list, for everyone. Who may add the
 * association is the editor's and the save's call (decision 0026).
 *
 * @returns Each author with the avatar's image, the role to show beside the
 *   name (none for the association) and whether it is the association.
 */
export async function getAuthorOptions() {
  const [authors, association] = await Promise.all([
    prisma.author.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        role: { select: { name: true } },
        user: { select: { image: { select: imageSourceSelect } } },
      },
    }),
    prisma.author.findFirst({
      select: { id: true },
      where: ASSOCIATION_AUTHOR_WHERE,
    }),
  ])

  return authors.map((author) => {
    const isAssociation = author.id === association?.id

    return {
      id: author.id,
      image: createImageSources('user-image', author.user?.image),
      isAssociation,
      name: author.name,
      roleLabel: isAssociation ? null : getAuthorRoleLabel(author.role.name),
    }
  })
}
