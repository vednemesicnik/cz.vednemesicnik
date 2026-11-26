import { prisma } from '~/utils/db.server'

// Best-effort session removal on sign-out: it must not break the response.
// deleteMany is idempotent (no throw when the row is already gone), and any
// transient DB error is swallowed with a log rather than becoming an unhandled
// promise rejection.
export const deleteSession = (id: string) => {
  void prisma.session.deleteMany({ where: { id } }).catch((error: unknown) => {
    console.error('Failed to delete session on sign-out', error)
  })
}
