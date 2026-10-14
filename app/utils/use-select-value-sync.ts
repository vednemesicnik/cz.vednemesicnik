import { type RefObject, useEffect } from 'react'

/**
 * Keeps an uncontrolled select on the value the loader hands it. React writes
 * `defaultValue` into the DOM on mount only, so applying a saved filter,
 * clearing one or going back would leave the previous option shown. Resynced by
 * hand rather than through a `key`, which would remount the select and drop
 * focus right after its own auto-submit.
 *
 * @param selectRef - The select to keep in sync.
 * @param defaultValue - The value the current URL selects.
 */
export const useSelectValueSync = (
  selectRef: RefObject<HTMLSelectElement | null>,
  defaultValue: unknown,
) => {
  useEffect(() => {
    const select = selectRef.current

    if (select === null) return

    const value = String(defaultValue ?? '')

    if (select.value !== value) {
      select.value = value
    }
  }, [defaultValue, selectRef])
}
