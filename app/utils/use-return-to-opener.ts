import type { MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'

/**
 * Leaving a record's add or edit page (design 30c, log 0016): back to the page
 * that opened it, or to the record's parent when nothing in the app did (a
 * shared link).
 *
 * @param parentPath - The record's parent with its query.
 * @returns `returnsToOpener`, whether a page of the app opened this one;
 *   `leave`, which goes back after a save; and `handleCancel` for the Zrušit
 *   link to `parentPath`.
 */
export const useReturnToOpener = (parentPath: string) => {
  const navigate = useNavigate()
  const location = useLocation()

  const returnsToOpener =
    location.state?.returnsToOpener === RETURN_TO_OPENER_STATE.returnsToOpener
  const leave = () =>
    returnsToOpener ? navigate(-1) : navigate(parentPath, { replace: true })

  // Zrušit is a link to the parent; opened from a page of the app, a plain
  // click goes back to that page instead, with its scroll position. A click
  // that opens a new tab stays a link.
  const handleCancel = (event: MouseEvent) => {
    const opensElsewhere =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey

    if (!returnsToOpener || opensElsewhere) return

    event.preventDefault()
    navigate(-1)
  }

  return { handleCancel, leave, returnsToOpener }
}
