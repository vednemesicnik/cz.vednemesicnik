import { prisma } from '~/utils/db.server'

/**
 * Whether a sign-in link belongs to the signed-in user (design 20c, 29d).
 * Compares the addresses lower-cased, like the confirmation page reads them,
 * so an address stored with capitals still matches its own link.
 *
 * @param email - The lower-cased address the link was issued for.
 * @param userId - The signed-in user.
 * @returns `true` when the link is for this user's address.
 */
export const isLinkForUser = async (email: string, userId: string) => {
  const user = await prisma.user.findUnique({
    select: { email: true },
    where: { id: userId },
  })

  return user !== null && user.email.trim().toLowerCase() === email
}
