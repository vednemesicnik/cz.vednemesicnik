import { useEffect, useEffectEvent } from 'react'
import { useRevalidator } from 'react-router'

/** What reloads the page's data; `useRevalidator()` and a fetcher both fit. */
type Revalidator = {
  revalidate: () => unknown
}

// Past the moment, so the server reads the hold as expired.
const AFTER_MILLISECONDS = 1000

/**
 * Reloads the page's data once the earliest of the given moments passes. An
 * edit hold's expiry sends no event (decision 0019), so a page showing
 * „upravuje …“ looks again when it should end; a renewed hold then sets the
 * next moment.
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

  useEffect(() => {
    if (earliest === null) return

    const timer = setTimeout(
      () => void revalidate(),
      Math.max(earliest - Date.now(), 0) + AFTER_MILLISECONDS,
    )

    return () => clearTimeout(timer)
  }, [earliest])
}
