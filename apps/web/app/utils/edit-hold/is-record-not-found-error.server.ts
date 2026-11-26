import { Prisma } from '@generated/prisma/client'

/**
 * Whether a conditional `update` or `delete` matched no row (Prisma `P2025`):
 * its `where` no longer held, for example because someone else holds the content.
 *
 * @param error - What the write threw.
 */
export const isRecordNotFoundError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2025'
