import { prisma } from '~/utils/db.server'

/**
 * Reads the author names of the given accounts in one query: whoever issued
 * an emergency sign-in link is named by their author name (#578, design 28e,
 * 20f). A deleted account has no entry, so its name is left out.
 *
 * @param userIds - The accounts; duplicates are fine.
 * @returns The names by user id.
 */
export const getUserAuthorNames = async (
  userIds: string[],
): Promise<Map<string, string>> => {
  if (userIds.length === 0) return new Map()

  const users = await prisma.user.findMany({
    select: { author: { select: { name: true } }, id: true },
    where: { id: { in: [...new Set(userIds)] } },
  })

  return new Map(users.map((user) => [user.id, user.author.name]))
}
