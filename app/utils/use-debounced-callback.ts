import { useEffect, useRef, useState } from 'react'

import { createDebouncedCallback } from '~/utils/create-debounced-callback'

/**
 * Debounces a callback for the lifetime of a component. The returned object
 * is stable across renders, always calls the latest `callback`, and drops a
 * pending call on unmount.
 *
 * @param callback - Called when the timer runs out.
 * @param delay - The quiet period in milliseconds, read on the first render.
 * @returns `run` to (re)start the timer and `cancel` to drop a pending call.
 */
export const useDebouncedCallback = (callback: () => void, delay: number) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  const [debounced] = useState(() =>
    createDebouncedCallback(() => callbackRef.current(), delay),
  )

  useEffect(() => debounced.cancel, [debounced])

  return debounced
}
