import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import { OPENS_AT_FIX_STATE } from '~/utils/opens-at-fix-state'

/**
 * Opens an editor at the first thing to fix when the missing-content dialog
 * opened it (design 23h, 26e, 27h, 6dlnv2de): once, as soon as the editor
 * holds the edit, since a locked fieldset can't take the focus. A plain
 * *Upravit* leaves the focus alone.
 *
 * @param isHolding - Whether the editor holds the edit now.
 * @param focusFix - Moves the focus to the first thing to fix.
 */
export const useFocusAtFix = (isHolding: boolean, focusFix: () => void) => {
  const location = useLocation()
  // Read as the editor opens; later navigations don't count.
  const [opensAtFix] = useState(
    () => location.state?.opensAtFix === OPENS_AT_FIX_STATE.opensAtFix,
  )
  const hasFocusedRef = useRef(false)

  const focusOnce = useEffectEvent(() => {
    if (!opensAtFix || hasFocusedRef.current) return
    hasFocusedRef.current = true
    focusFix()
  })
  useEffect(() => {
    if (isHolding) focusOnce()
  }, [isHolding])
}
