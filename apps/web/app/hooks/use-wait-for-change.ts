import { useEffect, useRef } from 'react'

// The same file again can keep its value, so the wait has a limit.
const WAIT_LIMIT = 1000

type Pending<Value> = { from: Value; settle: () => void }

/**
 * Waits for a rendered value to change: an upload ends once the stored file
 * has rendered (#742). A revalidation resolves before React shows its data,
 * so ending at once would show the previous file for a moment.
 *
 * @param value - The value as rendered, e.g. the stored file's key or URL.
 * @returns `waitForChange(from)`, which settles once a committed render shows
 *   a value other than `from`, at once if one has already, or after a second.
 */
export const useWaitForChange = <Value>(value: Value) => {
  // The committed value: a render React has not committed is not on screen.
  const committedRef = useRef(value)
  const pendingRef = useRef(new Set<Pending<Value>>())

  useEffect(() => {
    committedRef.current = value
    for (const pending of pendingRef.current) {
      if (value !== pending.from) pending.settle()
    }
  }, [value])

  return async (from: Value) => {
    if (committedRef.current !== from) return
    await new Promise<void>((resolve) => {
      const pending: Pending<Value> = {
        from,
        settle: () => {
          clearTimeout(timer)
          pendingRef.current.delete(pending)
          resolve()
        },
      }
      const timer = setTimeout(pending.settle, WAIT_LIMIT)
      pendingRef.current.add(pending)
    })
  }
}
