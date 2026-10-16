import type { Prisma } from '@generated/prisma/client'

/**
 * The association's author, *Vedneměsíčník, z. s.*: the author of the Owner's
 * account, of which there is exactly one (decision 0003). Only the Coordinator
 * signs an article as the association (design 24j, decision 0026).
 */
export const ASSOCIATION_AUTHOR_WHERE = {
  user: { role: { name: 'owner' } },
} satisfies Prisma.AuthorWhereInput
