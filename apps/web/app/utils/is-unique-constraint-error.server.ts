import { Prisma } from '@generated/prisma/client'

/** Whether a Prisma write failed on a unique constraint (P2002). */
export const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002'
