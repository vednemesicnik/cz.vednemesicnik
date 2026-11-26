import { useEffect, useEffectEvent, useState } from 'react'
import { useRevalidator } from 'react-router'

/** What reloads the page's data; `useRevalidator()` and a fetcher both fit. */
type Revalidator = {
  revalidate: () => unknown
}

// Past the moment, so the server reads the hold as expired.
const AFTER_MILLISECONDS = 1000
// A browser clock ahead of the server's fires early; look again a while.
const RETRY_MILLISECONDS = 5000
const MAX_RETRIES = 6

/**
 * Reloads the page's data once the earliest of the given moments passes. An
 * edit hold's expiry sends no event (log 0019), so a page showing
 * „upravuje …“ looks again when it should end; a renewed hold then sets the
 * next moment. When the same moment is still there after a reload (the
 * browser's clock runs ahead of the server's), it looks again a few times.
 *
 * @param moments - ISO 8601 moments; `null` entries are skipped.
 * @param revalidator - Replaces the page's revalidation (the article list
 *   loads only the rows on screen, 22f).
 */
export const useRevalidateAt = (
  moments: (string | null)[],
  revalidator?: Revalidator,
): void => {
  const pageRevalidator = useRevalidator()
  const revalidate = useEffectEvent(() =>
    (revalidator ?? pageRevalidator).revalidate(),
  )

  const times = moments.flatMap((moment) =>
    moment === null ? [] : [new Date(moment).getTime()],
  )
  const earliest = times.length === 0 ? null : Math.min(...times)

  // How often the current moment fired; a new moment starts over.
  const [firing, setFiring] = useState({ count: 0, moment: earliest })
  if (firing.moment !== earliest) {
    setFiring({ count: 0, moment: earliest })
  }
  const { count } = firing

  useEffect(() => {
    if (earliest === null || count > MAX_RETRIES) return

    const delay =
      count === 0
        ? Math.max(earliest - Date.now(), 0) + AFTER_MILLISECONDS
        : RETRY_MILLISECONDS

    const timer = setTimeout(() => {
      void revalidate()
      setFiring((current) =>
        current.moment === earliest
          ? { count: current.count + 1, moment: earliest }
          : current,
      )
    }, delay)

    return () => clearTimeout(timer)
  }, [earliest, count])
}
