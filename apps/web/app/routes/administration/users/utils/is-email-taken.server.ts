import { prisma } from '~/utils/db.server'

/**
 * Whether another account already signs in with this address, as its e-mail
 * or its username (both unique). The form says only that it is taken, not
 * whose it is (design 28f, log 0039).
 *
 * @param args.email - The submitted address, already lower-cased.
 * @param args.userId - The account being edited, which may keep its address;
 *   left out on Nový uživatel, where every account counts.
 */
export const isEmailTaken = async ({
  email,
  userId,
}: {
  email: string
  userId?: string
}) =>
  (await prisma.user.count({
    where: {
      ...(userId === undefined ? {} : { id: { not: userId } }),
      OR: [{ email }, { username: email }],
    },
  })) > 0
