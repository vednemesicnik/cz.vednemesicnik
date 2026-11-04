import { remember } from '@epic-web/remember'

import { deleteExpiredEnrolments } from './delete-expired-enrolments.server'

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

/**
 * Starts the sweep: once now, then daily, in-process like startAuthLogRetention.
 * remember() keeps it to one interval per process when the calling module is
 * re-evaluated (dev HMR). Called once from entry.server.
 */
export const startEnrolmentRetention = (): void => {
  remember('editorialBoardEnrolmentRetention', () => {
    deleteExpiredEnrolments()
    return setInterval(deleteExpiredEnrolments, CLEANUP_INTERVAL_MS).unref()
  })
}
