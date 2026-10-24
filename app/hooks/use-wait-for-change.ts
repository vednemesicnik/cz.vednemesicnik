import { useEffect, useRef } from 'react'

// The same file again can keep its value, so the wait has a limit.
const WAIT_LIMIT = 1000

/**
 * Waits for a rendered value to change: an upload ends once the stored file
 * has rendered (#742). A revalidation resolves before React shows its data,
 * so ending at once would show the previous file for a moment.
 *
 * @param value - The value as rendered, e.g. the stored file's key or URL.
 * @returns `waitForChange(from)`, which settles once a render shows a value
 *   other than `from`, at once if one has already, or after a second.
 */
export const useWaitForChange = <Value>(value: Value) => {
  const valueRef = useRef(value)
  valueRef.current = value
  const pendingRef = useRef<{ from: Value; settle: () => void } | null>(null)

  useEffect(() => {
    const pending = pendingRef.current
    if (pending !== null && value !== pending.from) pending.settle()
  }, [value])

  return async (from: Value) => {
    if (valueRef.current !== from) return
    await new Promise<void>((resolve) => {
      pendingRef.current = { from, settle: resolve }
      setTimeout(resolve, WAIT_LIMIT)
    })
    pendingRef.current = null
  }
}
