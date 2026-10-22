import { prisma } from '~/utils/db.server'

/**
 * Finds another account that already signs in with this address — as its
 * e-mail or its username, both unique — so the form can name it (design 28e).
 *
 * @param args.email - The submitted address, already lower-cased.
 * @param args.userId - The account being edited, which may keep its address.
 * @returns The other account's id and author name, or `null`.
 */
export const findEmailOwner = async ({
  email,
  userId,
}: {
  email: string
  userId: string
}) => {
  const owner = await prisma.user.findFirst({
    select: { author: { select: { name: true } }, id: true },
    where: {
      id: { not: userId },
      OR: [{ email }, { username: email }],
    },
  })

  return owner === null ? null : { name: owner.author.name, userId: owner.id }
}
