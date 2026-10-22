import { useEffect, useRef, useState } from 'react'
import { useFetcher, useRevalidator } from 'react-router'

import type { AuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'

import type { action } from '../author/_index/_action'

/**
 * A delete the server refused because something came to hold the author after
 * the page loaded (#767). A 409 skips the loaders' revalidation, so the
 * refusal carries the fresh block for the 28g explanation, and the page is
 * revalidated here: the next Smazat… then explains instead of confirming.
 *
 * @param fetcherKey - The delete fetcher's key (`delete-author-<id>`).
 * @returns The refused block until dismissed, and `dismiss`.
 */
export const useAuthorDeleteRefusal = (fetcherKey: string) => {
  const fetcher = useFetcher<typeof action>({ key: fetcherKey })
  const { revalidate } = useRevalidator()
  const [refusal, setRefusal] = useState<AuthorDeleteBlock | null>(null)
  // Each result opens the explanation once, however often the effect re-runs.
  const handledResultRef = useRef<typeof fetcher.data>(undefined)

  useEffect(() => {
    const result = fetcher.data

    if (fetcher.state !== 'idle' || result === handledResultRef.current) return

    handledResultRef.current = result

    if (result?.status === 'blocked') {
      setRefusal(result.deleteBlock)
      void revalidate()
    }
  }, [fetcher.data, fetcher.state, revalidate])

  return { dismiss: () => setRefusal(null), refusal }
}
